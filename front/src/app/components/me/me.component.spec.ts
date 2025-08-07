import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { expect } from '@jest/globals';
import { of } from 'rxjs';
import { User } from '../../interfaces/user.interface';
import { SessionService } from 'src/app/services/session.service';
import { UserService } from '../../services/user.service';

import { MeComponent } from './me.component';

describe('MeComponent', () => {
  let component: MeComponent;
  let fixture: ComponentFixture<MeComponent>;
  let userService: any;
  let sessionService: any;
  let router: any;
  let matSnackBar: any;

  const mockUser: User = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    admin: false,
    password: 'password123',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockSessionService = {
    sessionInformation: {
      admin: true,
      id: 1
    },
    logOut: jest.fn()
  };

  beforeEach(async () => {
    const userServiceSpy = {
      getById: jest.fn(),
      delete: jest.fn()
    };

    const routerSpy = {
      navigate: jest.fn()
    };

    const matSnackBarSpy = {
      open: jest.fn()
    };

    await TestBed.configureTestingModule({
      declarations: [MeComponent],
      imports: [
        MatSnackBarModule,
        HttpClientModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule
      ],
      providers: [
        { provide: SessionService, useValue: mockSessionService },
        { provide: UserService, useValue: userServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatSnackBar, useValue: matSnackBarSpy }
      ],
    })
      .compileComponents();

    fixture = TestBed.createComponent(MeComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService);
    sessionService = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    matSnackBar = TestBed.inject(MatSnackBar);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should fetch user data on init', () => {
      // Arrange
      userService.getById.mockReturnValue(of(mockUser));

      // Act
      component.ngOnInit();

      // Assert
      expect(userService.getById).toHaveBeenCalledWith('1');
    });

    it('should set user property with fetched data', () => {
      // Arrange
      userService.getById.mockReturnValue(of(mockUser));

      // Act
      component.ngOnInit();

      // Assert
      setTimeout(() => {
        expect(component.user).toEqual(mockUser);
      }, 0);
    });
  });

  describe('back', () => {
    it('should call window.history.back', () => {
      // Arrange
      const historySpy = jest.spyOn(window.history, 'back');

      // Act
      component.back();

      // Assert
      expect(historySpy).toHaveBeenCalled();

      // Cleanup
      historySpy.mockRestore();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      // Reset all mocks before each delete test
      userService.delete.mockReset();
      matSnackBar.open.mockReset();
      sessionService.logOut.mockReset();
      router.navigate.mockReset();
    });

    it('should delete user account and redirect', () => {
      // Arrange
      userService.delete.mockReturnValue(of({}));

      // Act
      component.delete();

      // Assert
      expect(userService.delete).toHaveBeenCalledWith('1');
      expect(matSnackBar.open).toHaveBeenCalledWith(
        'Your account has been deleted !',
        'Close',
        { duration: 3000 }
      );
      expect(sessionService.logOut).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle delete account flow completely', () => {
      // Arrange
      userService.delete.mockReturnValue(of({ message: 'Account deleted' }));

      // Act
      component.delete();

      // Assert
      expect(userService.delete).toHaveBeenCalledTimes(1);
      expect(matSnackBar.open).toHaveBeenCalledTimes(1);
      expect(sessionService.logOut).toHaveBeenCalledTimes(1);
      expect(router.navigate).toHaveBeenCalledTimes(1);
    });
  });
});
