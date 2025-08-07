import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { UnauthGuard } from './unauth.guard';
import { SessionService } from '../services/session.service';

describe('UnauthGuard', () => {
  let guard: UnauthGuard;
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
        UnauthGuard,
        { provide: Router, useValue: routerSpy },
        { provide: SessionService, useValue: sessionServiceSpy }
      ]
    });

    guard = TestBed.inject(UnauthGuard);
    router = TestBed.inject(Router);
    sessionService = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when user is not logged in', () => {
      // Arrange
      sessionService.isLogged = false;

      // Act
      const result = guard.canActivate();

      // Assert
      expect(result).toBe(true);
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should return false and navigate to rentals when user is logged in', () => {
      // Arrange
      sessionService.isLogged = true;

      // Act
      const result = guard.canActivate();

      // Assert
      expect(result).toBe(false);
      expect(router.navigate).toHaveBeenCalledWith(['rentals']);
    });
  });
});