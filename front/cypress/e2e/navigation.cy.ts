describe('Navigation and Routing E2E Tests', () => {
  const mockUser = {
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'User',
    admin: true,
    token: 'mock-jwt-token',
    type: 'Bearer'
  };

  const mockRegularUser = {
    id: 2,
    username: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    admin: false,
    token: 'mock-jwt-token-user',
    type: 'Bearer'
  };

  const mockSessions = [
    {
      id: 1,
      name: 'Yoga Session 1',
      description: 'Morning yoga session',
      date: '2024-03-15T10:00:00.000Z',
      teacher_id: 1,
      users: [2],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  const mockTeacher = {
    id: 1,
    firstName: 'Jane',
    lastName: 'Doe',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockUserData = {
    id: 1,
    email: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'User',
    admin: true,
    password: 'hashedpassword',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  beforeEach(() => {
    // Clear session storage
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('Unauthenticated Navigation', () => {
    it('should redirect to login when visiting root path', () => {
      cy.visit('/');
      cy.url().should('include', '/login');
    });

    it('should allow navigation between login and register', () => {
      // Start at login
      cy.visit('/login');
      cy.url().should('include', '/login');

      // Navigate to register
      cy.contains('Register').click();
      cy.url().should('include', '/register');

      // Navigate back to login
      cy.contains('Login').click();
      cy.url().should('include', '/login');
    });

    it('should redirect protected routes to login', () => {
      const protectedRoutes = ['/sessions', '/me', '/sessions/create', '/sessions/detail/1'];

      protectedRoutes.forEach(route => {
        cy.visit(route);
        cy.url().should('include', '/login');
      });
    });

    it('should handle browser back/forward navigation on auth pages', () => {
      // Navigate through auth pages
      cy.visit('/login');
      cy.contains('Register').click();
      cy.url().should('include', '/register');

      // Use browser back
      cy.go('back');
      cy.url().should('include', '/login');

      // Use browser forward
      cy.go('forward');
      cy.url().should('include', '/register');
    });

    it('should redirect already authenticated users away from auth pages', () => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock sessions API
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');

      // Try to visit login page
      cy.visit('/login');
      
      // Should redirect away from login (to home or 404 depending on UnauthGuard behavior)
      cy.url().should('not.include', '/login');
    });
  });

  describe('Authenticated Navigation', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock common APIs
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');

      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');
    });

    it('should allow navigation to all authenticated routes', () => {
      // Test sessions list
      cy.visit('/sessions');
      cy.wait('@getSessions');
      cy.url().should('include', '/sessions');

      // Test user profile
      cy.visit('/me');
      cy.wait('@getUserProfile');
      cy.url().should('include', '/me');
    });

    it('should navigate through main application flow', () => {
      // Start at sessions list
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Navigate to profile
      cy.get('[data-cy=profile-link]').click();
      cy.wait('@getUserProfile');
      cy.url().should('include', '/me');

      // Navigate back to sessions
      cy.get('[data-cy=back-button]').click();
      cy.url().should('include', '/sessions');
    });

    it('should handle session detail navigation', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Mock session detail APIs
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionDetail');

      cy.intercept('GET', '/api/teacher/1', {
        statusCode: 200,
        body: mockTeacher
      }).as('getTeacher');

      // Navigate to session detail
      cy.get('.item').first().click();
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');
      cy.url().should('include', '/sessions/detail/1');

      // Navigate back to sessions list
      cy.get('[data-cy=back-button]').click();
      cy.url().should('include', '/sessions');
      cy.wait('@getSessions');
    });

    it('should handle admin session management navigation', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Mock teachers API for create form
      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: [mockTeacher]
      }).as('getTeachers');

      // Navigate to create session
      cy.get('[data-cy=create-session-button]').click();
      cy.wait('@getTeachers');
      cy.url().should('include', '/sessions/create');

      // Navigate back to sessions
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Navigate to edit session
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionForEdit');

      cy.visit('/sessions/update/1');
      cy.wait('@getSessionForEdit');
      cy.wait('@getTeachers');
      cy.url().should('include', '/sessions/update/1');
    });

    it('should maintain navigation state across page refreshes', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Refresh page
      cy.reload();
      cy.wait('@getSessions');
      cy.url().should('include', '/sessions');

      // Navigate to profile and refresh
      cy.visit('/me');
      cy.wait('@getUserProfile');
      cy.reload();
      cy.wait('@getUserProfile');
      cy.url().should('include', '/me');
    });
  });

  describe('Navigation Header/Toolbar', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock APIs
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');
    });

    it('should display navigation elements for authenticated users', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // App title/logo should be visible
      cy.get('[data-cy=app-title]').should('be.visible');

      // User info should be displayed
      cy.get('[data-cy=user-name]').should('contain', 'Admin USER');

      // Logout button should be visible
      cy.get('[data-cy=logout-button]').should('be.visible');
    });

    it('should navigate via header links', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Mock user profile API
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');

      // Click on user name/profile link
      cy.get('[data-cy=user-name]').click();
      cy.wait('@getUserProfile');
      cy.url().should('include', '/me');

      // Navigate back to sessions via breadcrumb or back button
      cy.get('[data-cy=back-button]').click();
      cy.url().should('include', '/sessions');
    });

    it('should handle logout from navigation', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Click logout
      cy.get('[data-cy=logout-button]').click();

      // Should redirect to login/home
      cy.url().should('not.include', '/sessions');
      cy.url().should('match', /\/(login)?$/);

      // Session should be cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('sessionInformation')).to.be.null;
      });
    });

    it('should show different navigation for admin vs regular users', () => {
      // Test admin user navigation
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Admin should see create session button
      cy.get('[data-cy=create-session-button]').should('be.visible');

      // Setup regular user
      cy.window().then((win) => {
        win.sessionStorage.clear();
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockRegularUser));
      });

      cy.reload();
      cy.wait('@getSessions');

      // Regular user should not see create session button
      cy.get('[data-cy=create-session-button]').should('not.exist');
    });
  });

  describe('Error and 404 Navigation', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should display 404 page for non-existent routes', () => {
      cy.visit('/non-existent-route', { failOnStatusCode: false });
      
      // Should show 404 page
      cy.url().should('include', '/404');
      cy.contains('Page not found').should('be.visible');
    });

    it('should handle navigation from 404 page', () => {
      cy.visit('/404');
      
      // Mock sessions API
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');

      // Should provide navigation back to app
      cy.contains('Go back').click();
      cy.url().should('not.include', '/404');
    });

    it('should handle API error navigation', () => {
      // Mock API error
      cy.intercept('GET', '/api/session/999', {
        statusCode: 404,
        body: { error: 'Session not found' }
      }).as('getSessionNotFound');

      cy.visit('/sessions/detail/999', { failOnStatusCode: false });
      
      // Should handle gracefully - redirect to sessions list or show error
      cy.wait('@getSessionNotFound');
      // Behavior depends on error handling implementation
    });
  });

  describe('Deep Linking and URL Handling', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should handle direct navigation to session detail', () => {
      // Mock session detail APIs
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionDetail');

      cy.intercept('GET', '/api/teacher/1', {
        statusCode: 200,
        body: mockTeacher
      }).as('getTeacher');

      // Direct navigation to session detail
      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');
      
      cy.url().should('include', '/sessions/detail/1');
      cy.contains('Yoga Session 1').should('be.visible');
    });

    it('should handle direct navigation to admin routes', () => {
      // Mock teachers API
      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: [mockTeacher]
      }).as('getTeachers');

      // Direct navigation to create session (admin route)
      cy.visit('/sessions/create');
      cy.wait('@getTeachers');
      
      cy.url().should('include', '/sessions/create');
      cy.get('input[formControlName=name]').should('be.visible');
    });

    it('should preserve URL parameters and fragments', () => {
      // Mock session detail with query parameters
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: mockSessions[0]
      }).as('getSessionDetail');

      cy.intercept('GET', '/api/teacher/1', {
        statusCode: 200,
        body: mockTeacher
      }).as('getTeacher');

      // Visit with query parameters
      cy.visit('/sessions/detail/1?tab=info&highlight=true');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');
      
      cy.url().should('include', 'tab=info');
      cy.url().should('include', 'highlight=true');
    });
  });

  describe('Browser Navigation Integration', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock APIs
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');

      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');
    });

    it('should handle browser back button correctly', () => {
      // Navigate through app
      cy.visit('/sessions');
      cy.wait('@getSessions');

      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Use browser back button
      cy.go('back');
      cy.url().should('include', '/sessions');

      // Use browser forward button
      cy.go('forward');
      cy.url().should('include', '/me');
    });

    it('should maintain navigation history', () => {
      // Navigate through multiple pages
      cy.visit('/sessions');
      cy.wait('@getSessions');

      cy.visit('/me');
      cy.wait('@getUserProfile');

      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Browser history should work
      cy.go('back');
      cy.url().should('include', '/me');

      cy.go('back');
      cy.url().should('include', '/sessions');
    });

    it('should handle page refresh on any route', () => {
      const routes = ['/sessions', '/me'];

      routes.forEach(route => {
        cy.visit(route);
        
        // Wait for appropriate API
        if (route === '/sessions') {
          cy.wait('@getSessions');
        } else if (route === '/me') {
          cy.wait('@getUserProfile');
        }

        // Refresh page
        cy.reload();
        
        // Should stay on same route
        cy.url().should('include', route);
      });
    });
  });

  describe('Mobile Navigation', () => {
    beforeEach(() => {
      // Setup mobile viewport
      cy.viewport('iphone-6');
      
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock APIs
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: mockSessions
      }).as('getSessions');
    });

    it('should handle mobile navigation properly', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Navigation elements should be visible on mobile
      cy.get('[data-cy=logout-button]').should('be.visible');
      cy.get('[data-cy=user-name]').should('be.visible');
    });

    it('should handle mobile menu interactions', () => {
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // If there's a mobile menu toggle, test it
      // This depends on the specific mobile implementation
    });
  });
});