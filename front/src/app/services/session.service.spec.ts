import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';
import { SessionInformation } from '../interfaces/sessionInformation.interface';

import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with isLogged as false', () => {
    expect(service.isLogged).toBe(false);
  });

  it('should initialize with undefined sessionInformation', () => {
    expect(service.sessionInformation).toBeUndefined();
  });

  describe('$isLogged', () => {
    it('should return observable of isLogged state', (done) => {
      service.$isLogged().subscribe(isLogged => {
        expect(isLogged).toBe(false);
        done();
      });
    });

    it('should emit true when user logs in', (done) => {
      const mockSessionInfo: SessionInformation = {
        token: 'mock-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      service.$isLogged().subscribe(isLogged => {
        if (isLogged) {
          expect(isLogged).toBe(true);
          done();
        }
      });

      service.logIn(mockSessionInfo);
    });

    it('should emit false when user logs out', (done) => {
      const mockSessionInfo: SessionInformation = {
        token: 'mock-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      let emissionCount = 0;
      service.$isLogged().subscribe(isLogged => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(isLogged).toBe(false); // Initial state
        } else if (emissionCount === 2) {
          expect(isLogged).toBe(true); // After login
        } else if (emissionCount === 3) {
          expect(isLogged).toBe(false); // After logout
          done();
        }
      });

      service.logIn(mockSessionInfo);
      service.logOut();
    });
  });

  describe('logIn', () => {
    it('should set sessionInformation when logging in', () => {
      const mockSessionInfo: SessionInformation = {
        token: 'test-token',
        type: 'Bearer',
        id: 123,
        username: 'testuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        admin: true
      };

      service.logIn(mockSessionInfo);

      expect(service.sessionInformation).toEqual(mockSessionInfo);
      expect(service.isLogged).toBe(true);
    });

    it('should set isLogged to true when logging in', () => {
      const mockSessionInfo: SessionInformation = {
        token: 'test-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      service.logIn(mockSessionInfo);

      expect(service.isLogged).toBe(true);
    });

    it('should notify observers when logging in', (done) => {
      const mockSessionInfo: SessionInformation = {
        token: 'test-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      let emissionCount = 0;
      service.$isLogged().subscribe(isLogged => {
        emissionCount++;
        if (emissionCount === 2) { // Skip initial emission
          expect(isLogged).toBe(true);
          done();
        }
      });

      service.logIn(mockSessionInfo);
    });
  });

  describe('logOut', () => {
    it('should clear sessionInformation when logging out', () => {
      // First log in
      const mockSessionInfo: SessionInformation = {
        token: 'test-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };
      service.logIn(mockSessionInfo);

      // Then log out
      service.logOut();

      expect(service.sessionInformation).toBeUndefined();
      expect(service.isLogged).toBe(false);
    });

    it('should set isLogged to false when logging out', () => {
      // First log in
      const mockSessionInfo: SessionInformation = {
        token: 'test-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };
      service.logIn(mockSessionInfo);
      expect(service.isLogged).toBe(true);

      // Then log out
      service.logOut();

      expect(service.isLogged).toBe(false);
    });

    it('should notify observers when logging out', (done) => {
      const mockSessionInfo: SessionInformation = {
        token: 'test-token',
        type: 'Bearer',
        id: 1,
        username: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        admin: false
      };

      let emissionCount = 0;
      service.$isLogged().subscribe(isLogged => {
        emissionCount++;
        if (emissionCount === 3) { // Initial(false) -> login(true) -> logout(false)
          expect(isLogged).toBe(false);
          done();
        }
      });

      service.logIn(mockSessionInfo);
      service.logOut();
    });
  });
});
