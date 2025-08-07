import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { SessionService } from '../services/session.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let router: any;
  let sessionService: any;

  beforeEach(() => {
    const routerSpy = {
      navigate: jest.fn()
    };
    const sessionServiceSpy = {
      isLogged: false
    };

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: routerSpy },
        { provide: SessionService, useValue: sessionServiceSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is logged in', () => {
      // Arrange
      sessionService.isLogged = true;

      // Act
      const result = guard.canActivate();

      // Assert
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should return false and navigate to login when user is not logged in', () => {
      // Arrange
      sessionService.isLogged = false;

      // Act
      const result = guard.canActivate();

      // Assert
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['login']);
    });
  });
});