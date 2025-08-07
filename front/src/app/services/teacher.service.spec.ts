import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { expect } from '@jest/globals';
import { Teacher } from '../interfaces/teacher.interface';

import { TeacherService } from './teacher.service';

describe('TeacherService', () => {
  let service: TeacherService;
  let httpTestingController: HttpTestingController;

  const mockTeacher: Teacher = {
    id: 1,
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  };

  const mockTeachers: Teacher[] = [
    mockTeacher,
    {
      id: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02')
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TeacherService]
    });
    service = TestBed.inject(TeacherService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('all', () => {
    it('should get all teachers', () => {
      // Act
      service.all().subscribe(teachers => {
        expect(teachers).toEqual(mockTeachers);
        expect(teachers.length).toBe(2);
      });

      // Assert
      const req = httpTestingController.expectOne('api/teacher');
      expect(req.request.method).toBe('GET');
      req.flush(mockTeachers);
    });

    it('should handle empty teachers list', () => {
      // Act
      service.all().subscribe(teachers => {
        expect(teachers).toEqual([]);
        expect(teachers.length).toBe(0);
      });

      // Assert
      const req = httpTestingController.expectOne('api/teacher');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should handle error when fetching teachers', () => {
      // Act
      service.all().subscribe({
        error: (error) => {
          expect(error).toBeDefined();
        }
      });

      // Assert
      const req = httpTestingController.expectOne('api/teacher');
      req.flush('Error occurred', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('detail', () => {
    it('should get teacher details by id', () => {
      const teacherId = '1';

      // Act
      service.detail(teacherId).subscribe(teacher => {
        expect(teacher).toEqual(mockTeacher);
        expect(teacher.id).toBe(1);
        expect(teacher.firstName).toBe('John');
        expect(teacher.lastName).toBe('Doe');
      });

      // Assert
      const req = httpTestingController.expectOne(`api/teacher/${teacherId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTeacher);
    });

    it('should handle string id parameter', () => {
      const teacherId = '999';

      // Act
      service.detail(teacherId).subscribe();

      // Assert
      const req = httpTestingController.expectOne(`api/teacher/${teacherId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe(`api/teacher/${teacherId}`);
      req.flush(mockTeacher);
    });

    it('should handle error when fetching teacher detail', () => {
      const teacherId = '1';

      // Act
      service.detail(teacherId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      // Assert
      const req = httpTestingController.expectOne(`api/teacher/${teacherId}`);
      req.flush('Teacher not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('pathService', () => {
    it('should use correct base path for API calls', () => {
      // Act
      service.all().subscribe();

      // Assert
      const req = httpTestingController.expectOne(request => 
        request.url.includes('api/teacher')
      );
      expect(req.request.url).toBe('api/teacher');
      req.flush([]);
    });
  });
});
