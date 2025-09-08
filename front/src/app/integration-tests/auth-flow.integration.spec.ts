import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { expect } from '@jest/globals';
import { of, throwError } from 'rxjs';

import { LoginComponent } from '../features/auth/components/login/login.component';
import { RegisterComponent } from '../features/auth/components/register/register.component';
import { AuthService } from '../features/auth/services/auth.service';
import { SessionService } from '../services/session.service';
import { SessionInformation } from '../interfaces/sessionInformation.interface';

// Mock components for routing
@Component({ template: 'Sessions Mock' })
class MockSessionsComponent { }

@Component({ template: 'Home Mock' })
class MockHomeComponent { }

describe('Authentication Flow Integration Tests', () => {
  let httpTestingController: HttpTestingController;
  let router: Router;
  let location: Location;
  let authService: AuthService;
  let sessionService: SessionService;

  const mockSessionInfo: SessionInformation = {
    token: 'mock-jwt-token',
    type: 'Bearer',
    id: 1,
    username: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    admin: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LoginComponent,
        RegisterComponent,
        MockSessionsComponent,
        MockHomeComponent
      ],
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatSnackBarModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        RouterTestingModule.withRoutes([
          { path: 'login', component: LoginComponent },
          { path: 'register', component: RegisterComponent },
          { path: 'sessions', component: MockSessionsComponent },
          { path: '', component: MockHomeComponent }
        ])
      ],
      providers: [AuthService, SessionService]
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    authService = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  describe('Login Flow Integration', () => {
    let loginFixture: ComponentFixture<LoginComponent>;
    let loginComponent: LoginComponent;

    beforeEach(() => {
      loginFixture = TestBed.createComponent(LoginComponent);
      loginComponent = loginFixture.componentInstance;
      loginFixture.detectChanges();
    });

    it('should complete successful login flow end-to-end', async () => {
      // Arrange
      const loginData = { email: 'test@example.com', password: 'password123' };

      // Set form values
      loginComponent.form.patchValue(loginData);
      loginFixture.detectChanges();

      // Act
      loginComponent.submit();

      // Verify API call
      const req = httpTestingController.expectOne('api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(loginData);
      req.flush(mockSessionInfo);

      // Wait for navigation
      await loginFixture.whenStable();

      // Assert
      expect(sessionService.isLogged).toBe(true);
      expect(sessionService.sessionInformation).toEqual(mockSessionInfo);
      expect(location.path()).toBe('/sessions');
      expect(loginComponent.onError).toBe(false);
    });

    it('should handle login failure and show error state', async () => {
      // Arrange
      const loginData = { email: 'wrong@email.com', password: 'wrongpassword' };

      loginComponent.form.patchValue(loginData);
      loginFixture.detectChanges();

      // Act
      loginComponent.submit();

      // Simulate API error
      const req = httpTestingController.expectOne('api/auth/login');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

      await loginFixture.whenStable();

      // Assert
      expect(sessionService.isLogged).toBe(false);
      expect(sessionService.sessionInformation).toBeUndefined();
      expect(loginComponent.onError).toBe(true);
      expect(location.path()).toBe(''); // Should stay on current page
    });

    it('should validate form fields before submission', () => {
      // Arrange - Set invalid data
      loginComponent.form.patchValue({ email: '', password: '' });
      loginFixture.detectChanges();

      // Act
      const emailControl = loginComponent.form.get('email');
      const passwordControl = loginComponent.form.get('password');

      // Assert
      expect(emailControl?.hasError('required')).toBe(true);
      expect(passwordControl?.hasError('required')).toBe(true);
      expect(loginComponent.form.valid).toBe(false);
    });
  });

  describe('Registration Flow Integration', () => {
    let registerFixture: ComponentFixture<RegisterComponent>;
    let registerComponent: RegisterComponent;

    beforeEach(() => {
      registerFixture = TestBed.createComponent(RegisterComponent);
      registerComponent = registerFixture.componentInstance;
      registerFixture.detectChanges();
    });

    it('should complete successful registration flow end-to-end', async () => {
      // Arrange
      const registerData = {
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User',
        password: 'newpassword123'
      };

      registerComponent.form.patchValue(registerData);
      registerFixture.detectChanges();

      // Act
      registerComponent.submit();

      // Verify API call
      const req = httpTestingController.expectOne('api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(registerData);
      req.flush({}); // Registration typically returns empty object

      await registerFixture.whenStable();

      // Assert
      expect(location.path()).toBe('/login');
      expect(registerComponent.onError).toBe(false);
    });

    it('should handle registration failure and show error state', async () => {
      // Arrange
      const registerData = {
        email: 'existing@example.com',
        firstName: 'Existing',
        lastName: 'User', 
        password: 'password123'
      };

      registerComponent.form.patchValue(registerData);
      registerFixture.detectChanges();

      // Act
      registerComponent.submit();

      // Simulate API error
      const req = httpTestingController.expectOne('api/auth/register');
      req.flush('User already exists', { status: 400, statusText: 'Bad Request' });

      await registerFixture.whenStable();

      // Assert
      expect(registerComponent.onError).toBe(true);
      expect(location.path()).toBe(''); // Should stay on current page
    });
  });

  describe('Auth Service Integration', () => {
    it('should integrate with SessionService during login', () => {
      // Arrange
      const loginRequest = { email: 'test@example.com', password: 'password123' };
      
      // Act
      authService.login(loginRequest).subscribe((response) => {
        sessionService.logIn(response);
      });

      // Verify API call and response
      const req = httpTestingController.expectOne('api/auth/login');
      req.flush(mockSessionInfo);

      // Assert
      expect(sessionService.isLogged).toBe(true);
      expect(sessionService.sessionInformation).toEqual(mockSessionInfo);
    });

    it('should handle HTTP errors properly', () => {
      // Arrange
      const loginRequest = { email: 'test@example.com', password: 'wrongpassword' };
      let errorResponse: any;

      // Act
      authService.login(loginRequest).subscribe({
        error: (error) => errorResponse = error
      });

      // Simulate error
      const req = httpTestingController.expectOne('api/auth/login');
      req.flush('Invalid credentials', { status: 401, statusText: 'Unauthorized' });

      // Assert
      expect(errorResponse).toBeDefined();
      expect(errorResponse.status).toBe(401);
      expect(sessionService.isLogged).toBe(false);
    });
  });

  describe('Session State Integration', () => {
    it('should maintain session state across components', () => {
      // Arrange
      sessionService.logIn(mockSessionInfo);

      // Act & Assert - Create different components and verify they see the same session
      const loginFixture = TestBed.createComponent(LoginComponent);
      const registerFixture = TestBed.createComponent(RegisterComponent);

      expect(sessionService.isLogged).toBe(true);
      expect(sessionService.sessionInformation).toEqual(mockSessionInfo);

      // Clean up
      loginFixture.destroy();
      registerFixture.destroy();
    });

    it('should clear session on logout', () => {
      // Arrange
      sessionService.logIn(mockSessionInfo);
      expect(sessionService.isLogged).toBe(true);

      // Act
      sessionService.logOut();

      // Assert
      expect(sessionService.isLogged).toBe(false);
      expect(sessionService.sessionInformation).toBeUndefined();
    });
  });
});