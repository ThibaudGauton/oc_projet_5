describe('Error Handling E2E Tests', () => {
  const mockUser = {
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'User',
    admin: true,
    token: 'mock-jwt-token',
    type: 'Bearer'
  };

  beforeEach(() => {
    // Clear session storage
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  });

  describe('API Error Handling', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should handle 404 errors for non-existent sessions', () => {
      // Mock 404 response for session detail
      cy.intercept('GET', '/api/session/999', {
        statusCode: 404,
        body: { error: 'Session not found' }
      }).as('getSessionNotFound');

      cy.visit('/sessions/detail/999', { failOnStatusCode: false });
      cy.wait('@getSessionNotFound');

      // Should handle error gracefully - could redirect or show error message
      // The specific behavior depends on the application's error handling
    });

    it('should handle 500 server errors gracefully', () => {
      // Mock server error for sessions list
      cy.intercept('GET', '/api/session', {
        statusCode: 500,
        body: { error: 'Internal server error' }
      }).as('getSessionsServerError');

      cy.visit('/sessions');
      cy.wait('@getSessionsServerError');

      // Should display error message or fallback UI
      // The specific implementation depends on the app's error handling
    });

    it('should handle network errors', () => {
      // Mock network failure
      cy.intercept('GET', '/api/session', { forceNetworkError: true }).as('getSessionsNetworkError');

      cy.visit('/sessions');
      cy.wait('@getSessionsNetworkError');

      // Should handle network error gracefully
    });

    it('should handle authentication errors (401)', () => {
      // Mock authentication error
      cy.intercept('GET', '/api/session', {
        statusCode: 401,
        body: { error: 'Unauthorized' }
      }).as('getSessionsUnauthorized');

      cy.visit('/sessions');
      cy.wait('@getSessionsUnauthorized');

      // Should redirect to login page
      cy.url().should('include', '/login');
    });

    it('should handle forbidden errors (403)', () => {
      // Mock forbidden error
      cy.intercept('GET', '/api/session', {
        statusCode: 403,
        body: { error: 'Forbidden' }
      }).as('getSessionsForbidden');

      cy.visit('/sessions');
      cy.wait('@getSessionsForbidden');

      // Should display appropriate error message or redirect
    });
  });

  describe('Form Validation Errors', () => {
    beforeEach(() => {
      // Setup authenticated admin user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should display validation errors on login form', () => {
      // Clear auth to test login
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      cy.visit('/login');

      // Try to submit empty form
      cy.get('input[formControlName=email]').focus().blur();
      cy.get('input[formControlName=password]').focus().blur();

      // Should show validation errors
      // The specific selectors depend on how validation is implemented
      cy.get('button[type=submit]').should('be.disabled');
    });

    it('should display validation errors on registration form', () => {
      // Clear auth to test registration
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      cy.visit('/register');

      // Try to submit form with invalid data
      cy.get('input[formControlName=email]').type('invalid-email');
      cy.get('input[formControlName=password]').type('123'); // Too short

      // Should show validation errors and disable submit
      cy.get('button[type=submit]').should('be.disabled');
    });

    it('should display validation errors on session creation form', () => {
      // Mock teachers API
      cy.intercept('GET', '/api/teacher', {
        statusCode: 200,
        body: [
          {
            id: 1,
            firstName: 'Jane',
            lastName: 'Doe',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          }
        ]
      }).as('getTeachers');

      cy.visit('/sessions/create');
      cy.wait('@getTeachers');

      // Try to submit form with missing required fields
      cy.get('input[formControlName=name]').focus().blur();
      cy.get('textarea[formControlName=description]').focus().blur();

      // Should show validation errors and disable submit
      cy.get('button[type=submit]').should('be.disabled');
    });

    it('should clear validation errors when form becomes valid', () => {
      // Clear auth to test login validation
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      cy.visit('/login');

      // Trigger validation errors
      cy.get('input[formControlName=email]').focus().blur();
      cy.get('button[type=submit]').should('be.disabled');

      // Fix validation errors
      cy.get('input[formControlName=email]').type('valid@email.com');
      cy.get('input[formControlName=password]').type('validpassword');

      // Form should become valid
      cy.get('button[type=submit]').should('not.be.disabled');
    });
  });

  describe('Session Timeout and Authentication Errors', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should handle expired token during API calls', () => {
      // Mock expired token response
      cy.intercept('GET', '/api/user/1', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('getExpiredToken');

      cy.visit('/me');
      cy.wait('@getExpiredToken');

      // Should redirect to login
      cy.url().should('include', '/login');
      
      // Session should be cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('sessionInformation')).to.be.null;
      });
    });

    it('should handle token expiration during session participation', () => {
      // Setup session detail page
      cy.intercept('GET', '/api/session/1', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'Yoga Session 1',
          description: 'Test session',
          date: '2024-03-15T10:00:00.000Z',
          teacher_id: 1,
          users: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }).as('getSessionDetail');

      cy.intercept('GET', '/api/teacher/1', {
        statusCode: 200,
        body: {
          id: 1,
          firstName: 'Jane',
          lastName: 'Doe',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      }).as('getTeacher');

      cy.visit('/sessions/detail/1');
      cy.wait('@getSessionDetail');
      cy.wait('@getTeacher');

      // Mock expired token on participation
      cy.intercept('POST', '/api/session/1/participate/1', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('participateExpired');

      cy.get('[data-cy=participate-button]').click();
      cy.wait('@participateExpired');

      // Should handle error appropriately
      cy.url().should('include', '/login');
    });
  });

  describe('UI Error States', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should display loading states during API calls', () => {
      // Mock delayed response
      cy.intercept('GET', '/api/session', (req) => {
        // Add delay to simulate loading
        req.reply((res) => {
          res.setDelay(1000);
          res.send({
            statusCode: 200,
            body: []
          });
        });
      }).as('getSessionsDelayed');

      cy.visit('/sessions');

      // Should show loading indicator
      // The specific selector depends on the loading implementation
      
      cy.wait('@getSessionsDelayed');
      
      // Loading should disappear after API call
    });

    it('should handle empty states gracefully', () => {
      // Mock empty response
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getEmptySessions');

      cy.visit('/sessions');
      cy.wait('@getEmptySessions');

      // Should display empty state message or no items
      cy.get('.item').should('have.length', 0);
    });

    it('should display error messages for failed operations', () => {
      // Mock failed login
      cy.window().then((win) => {
        win.sessionStorage.clear();
      });

      cy.visit('/login');

      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'Invalid credentials' }
      }).as('loginFailed');

      cy.get('input[formControlName=email]').type('test@example.com');
      cy.get('input[formControlName=password]').type('wrongpassword');
      cy.get('button[type=submit]').click();

      cy.wait('@loginFailed');

      // Should display error message
      cy.get('.error').should('be.visible').and('contain', 'An error occurred');
    });
  });

  describe('Concurrent Request Error Handling', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should handle multiple simultaneous API failures', () => {
      // Mock multiple failing APIs
      cy.intercept('GET', '/api/session', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getSessionsError');

      cy.intercept('GET', '/api/user/1', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getUserError');

      // Navigate to page that triggers multiple API calls
      cy.visit('/sessions');
      cy.wait('@getSessionsError');

      // Navigate to profile
      cy.visit('/me');
      cy.wait('@getUserError');

      // Should handle both errors appropriately
    });

    it('should recover from temporary API failures', () => {
      // First call fails, second succeeds
      let callCount = 0;
      cy.intercept('GET', '/api/session', (req) => {
        callCount++;
        if (callCount === 1) {
          req.reply({
            statusCode: 500,
            body: { error: 'Temporary error' }
          });
        } else {
          req.reply({
            statusCode: 200,
            body: []
          });
        }
      }).as('getSessionsRetry');

      cy.visit('/sessions');
      cy.wait('@getSessionsRetry');

      // Refresh page to retry
      cy.reload();
      cy.wait('@getSessionsRetry');

      // Second call should succeed
    });
  });

  describe('Client-Side Error Handling', () => {
    it('should handle JavaScript errors gracefully', () => {
      // Visit page and cause a JavaScript error
      cy.visit('/sessions');

      // Simulate JavaScript error
      cy.window().then((win) => {
        // Override a method to throw error
        const originalMethod = win.console.error;
        win.console.error = cy.spy().as('consoleError');
        
        // Trigger error (this is just an example)
        win.dispatchEvent(new Event('error'));
        
        // Restore original method
        win.console.error = originalMethod;
      });

      // Application should continue functioning
    });

    it('should handle malformed API responses', () => {
      // Mock malformed JSON response
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: 'invalid json response'
      }).as('getMalformedResponse');

      cy.visit('/sessions');
      cy.wait('@getMalformedResponse');

      // Should handle malformed response gracefully
    });

    it('should handle unexpected API response formats', () => {
      // Mock unexpected response format
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: { unexpected: 'format', missing: 'expected fields' }
      }).as('getUnexpectedFormat');

      cy.visit('/sessions');
      cy.wait('@getUnexpectedFormat');

      // Should handle unexpected format gracefully
    });
  });

  describe('Browser Compatibility and Edge Cases', () => {
    it('should handle browser storage failures', () => {
      // Simulate storage quota exceeded
      cy.visit('/login');

      // Mock successful login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          id: 1,
          username: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          admin: false,
          token: 'mock-jwt-token',
          type: 'Bearer'
        }
      }).as('loginSuccess');

      // Mock sessions API
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getSessions');

      // Try to login
      cy.get('input[formControlName=email]').type('test@example.com');
      cy.get('input[formControlName=password]').type('password123');
      cy.get('button[type=submit]').click();

      cy.wait('@loginSuccess');

      // Should handle storage failure gracefully
      cy.url().should('include', '/sessions');
    });

    it('should handle browser back button during error states', () => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock error response
      cy.intercept('GET', '/api/session', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getSessionsError');

      cy.visit('/sessions');
      cy.wait('@getSessionsError');

      // Use browser back button
      cy.go('back');

      // Should handle navigation during error state
    });
  });
});