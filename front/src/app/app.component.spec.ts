import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { expect } from '@jest/globals';
import { of } from 'rxjs';
import { AuthService } from './features/auth/services/auth.service';
import { SessionService } from './services/session.service';

import { AppComponent } from './app.component';


describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: any;
  let authService: any;
  let sessionService: any;
  let router: any;

  beforeEach(async () => {
    const authServiceSpy = {
      // Add auth service methods if needed
    };

    const sessionServiceSpy = {
      $isLogged: jest.fn(),
      logOut: jest.fn()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        MatToolbarModule
      ],
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SessionService, useValue: sessionServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  describe('$isLogged', () => {
    it('should return observable from sessionService.$isLogged', () => {
      // Arrange
      const mockObservable = of(true);
      sessionService.$isLogged.mockReturnValue(mockObservable);

      // Act
      const result = component.$isLogged();

      // Assert
      expect(sessionService.$isLogged).toHaveBeenCalled();
      expect(result).toBe(mockObservable);
    });

    it('should handle logged out state', () => {
      // Arrange
      const mockObservable = of(false);
      sessionService.$isLogged.mockReturnValue(mockObservable);

      // Act
      const result = component.$isLogged();

      // Assert
      expect(sessionService.$isLogged).toHaveBeenCalled();
      expect(result).toBe(mockObservable);
    });
  });

  describe('logout', () => {
    it('should call sessionService.logOut and navigate to home', () => {
      // Act
      component.logout();

      // Assert
      expect(sessionService.logOut).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['']);
    });

    it('should logout and redirect to root path', () => {
      // Act
      component.logout();

      // Assert
      expect(sessionService.logOut).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledWith(['']);
    });
  });
});
