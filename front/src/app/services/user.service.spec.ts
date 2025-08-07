import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';
import { User } from '../interfaces/user.interface';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let httpTestingController: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });
    service = TestBed.inject(UserService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getById', () => {
    it('should get user by id', () => {
      const userId = '1';

      // Act
      service.getById(userId).subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(user.id).toBe(1);
        expect(user.firstName).toBe('John');
        expect(user.lastName).toBe('Doe');
        expect(user.email).toBe('john.doe@example.com');
      });

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should handle string id parameter', () => {
      const userId = '999';

      // Act
      service.getById(userId).subscribe();

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`api/user/${userId}`);
      req.flush(mockUser);
    });

    it('should handle error when fetching user', () => {
      const userId = '1';

      // Act
      service.getById(userId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle admin user correctly', () => {
      const userId = '1';
      const adminUser: User = {
        ...mockUser,
        admin: true
      };

      // Act
      service.getById(userId).subscribe(user => {
        expect(user.admin).toBe(true);
      });

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(adminUser);
    });
  });

  describe('delete', () => {
    it('should delete user by id', () => {
      const userId = '1';

      // Act
      service.delete(userId).subscribe(response => {
        expect(response).toBeDefined();
      });

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should handle delete with string id', () => {
      const userId = '999';

      // Act
      service.delete(userId).subscribe();

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.url).toBe(`api/user/${userId}`);
      req.flush(null);
    });

    it('should handle delete error', () => {
      const userId = '1';

      // Act
      service.delete(userId).subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });

    it('should return response after successful delete', () => {
      const userId = '1';
      const deleteResponse = { message: 'User deleted successfully' };

      // Act
      service.delete(userId).subscribe(response => {
        expect(response).toEqual(deleteResponse);
      });

      // Assert
      const req = httpTestingController.expectOne(`api/user/${userId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(deleteResponse);
    });
  });

  describe('pathService', () => {
    it('should use correct base path for API calls', () => {
      // Act
      service.getById('1').subscribe();

      // Assert
      const req = httpTestingController.expectOne(request => 
        request.url.includes('api/user')
      );
      expect(req.request.url).toBe('api/user/1');
      req.flush({});
    });
  });
});
