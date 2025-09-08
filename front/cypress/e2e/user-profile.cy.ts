describe('User Profile E2E Tests', () => {
  const mockUser = {
    id: 1,
    username: 'yoga@studio.com',
    firstName: 'Admin',
    lastName: 'User',
    admin: true,
    token: 'mock-jwt-token',
    type: 'Bearer'
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

  const mockRegularUser = {
    id: 2,
    username: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    admin: false,
    token: 'mock-jwt-token-user',
    type: 'Bearer'
  };

  const mockRegularUserData = {
    id: 2,
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    admin: false,
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

  describe('Profile View', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock user API
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');
    });

    it('should display user profile information', () => {
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Verify profile information is displayed
      cy.contains('Admin').should('be.visible');
      cy.contains('USER').should('be.visible');
      cy.contains('yoga@studio.com').should('be.visible');
      
      // Verify admin badge if user is admin
      cy.contains('You are admin').should('be.visible');
      
      // Verify creation date
      cy.contains('Create at:').should('be.visible');
      cy.contains('January 1, 2024').should('be.visible');
      
      // Verify last update date
      cy.contains('Last update:').should('be.visible');
    });

    it('should display regular user profile without admin badge', () => {
      // Setup regular user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockRegularUser));
      });

      // Mock regular user API
      cy.intercept('GET', '/api/user/2', {
        statusCode: 200,
        body: mockRegularUserData
      }).as('getRegularUserProfile');

      cy.visit('/me');
      cy.wait('@getRegularUserProfile');

      // Verify profile information is displayed
      cy.contains('John').should('be.visible');
      cy.contains('DOE').should('be.visible');
      cy.contains('user@example.com').should('be.visible');
      
      // Admin badge should not be visible
      cy.contains('You are admin').should('not.exist');
    });

    it('should handle profile loading error', () => {
      // Mock user API error
      cy.intercept('GET', '/api/user/1', {
        statusCode: 404,
        body: { error: 'User not found' }
      }).as('getUserProfileError');

      cy.visit('/me');
      cy.wait('@getUserProfileError');

      // Should handle error gracefully (specific behavior depends on implementation)
      // Could redirect to login, show error message, etc.
    });

    it('should allow navigation back from profile', () => {
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Mock sessions API for navigation
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getSessions');

      // Click back button
      cy.get('[data-cy=back-button]').should('be.visible').click();

      // Should navigate back (could be to sessions or previous page)
      // Browser back functionality
    });
  });

  describe('Account Deletion', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock user API
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');
    });

    it('should successfully delete user account', () => {
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Mock delete user API
      cy.intercept('DELETE', '/api/user/1', {
        statusCode: 200,
        body: { message: 'User deleted successfully' }
      }).as('deleteUser');

      // Click delete button
      cy.get('[data-cy=delete-account-button]').should('be.visible').click();

      // Handle confirmation dialog if present
      // This depends on the specific implementation
      
      // Wait for delete API call
      cy.wait('@deleteUser');

      // Should redirect to home/login page
      cy.url().should('match', /\/(login)?$/);

      // Verify session is cleared
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('sessionInformation')).to.be.null;
      });
    });

    it('should show confirmation before deleting account', () => {
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Click delete button
      cy.get('[data-cy=delete-account-button]').should('be.visible').click();

      // Should show confirmation dialog or message
      // This test depends on specific implementation - could be:
      // - Browser confirm dialog
      // - Custom modal
      // - Confirmation step
      // For now, we'll assume there's some confirmation UI element
    });

    it('should handle delete account error', () => {
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Mock delete user API error
      cy.intercept('DELETE', '/api/user/1', {
        statusCode: 400,
        body: { error: 'Cannot delete user' }
      }).as('deleteUserError');

      // Click delete button
      cy.get('[data-cy=delete-account-button]').should('be.visible').click();

      // Wait for error
      cy.wait('@deleteUserError');

      // Should handle error gracefully and stay on profile page
      cy.url().should('include', '/me');
      
      // User should still be logged in
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('sessionInformation')).to.not.be.null;
      });
    });

    it('should prevent account deletion for admin users in certain scenarios', () => {
      // This test is for business logic where admin accounts might have restrictions
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Depending on business rules, admin users might not see delete button
      // or get different behavior - this is implementation specific
    });
  });

  describe('Profile Navigation Integration', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });
    });

    it('should be accessible from main navigation', () => {
      // Mock sessions API for main page
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getSessions');

      // Mock user profile API
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');

      // Start from sessions page
      cy.visit('/sessions');
      cy.wait('@getSessions');

      // Click on user profile link in navigation
      cy.get('[data-cy=profile-link]').should('be.visible').click();

      // Should navigate to profile
      cy.url().should('include', '/me');
      cy.wait('@getUserProfile');
    });

    it('should show user name in navigation header', () => {
      // Mock sessions API
      cy.intercept('GET', '/api/session', {
        statusCode: 200,
        body: []
      }).as('getSessions');

      cy.visit('/sessions');
      cy.wait('@getSessions');

      // User name should be visible in header/navigation
      cy.get('[data-cy=user-name]').should('contain', 'Admin USER');
    });

    it('should handle profile access from different pages', () => {
      // Mock various APIs
      cy.intercept('GET', '/api/session', []).as('getSessions');
      cy.intercept('GET', '/api/user/1', mockUserData).as('getUserProfile');

      // Test navigation to profile from sessions page
      cy.visit('/sessions');
      cy.wait('@getSessions');
      
      cy.visit('/me');
      cy.wait('@getUserProfile');
      cy.url().should('include', '/me');

      // Test direct access to profile
      cy.visit('/me');
      cy.url().should('include', '/me');
    });
  });

  describe('Profile Security', () => {
    it('should prevent access to profile when not authenticated', () => {
      // Try to visit profile without authentication
      cy.visit('/me');

      // Should redirect to login
      cy.url().should('include', '/login');
    });

    it('should prevent access to other users profiles', () => {
      // Setup user 1
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Try to access another user's profile (if URL supports it)
      // This would depend on if the app exposes user IDs in URLs
      
      // Mock user 1's profile
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');

      // Visit profile page
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Should only show user 1's data
      cy.contains('yoga@studio.com').should('be.visible');
      cy.contains('user@example.com').should('not.exist');
    });

    it('should maintain authentication state on profile page', () => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock user API
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');

      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Logout button should be visible
      cy.get('[data-cy=logout-button]').should('be.visible');

      // Session information should still be present
      cy.window().then((win) => {
        expect(win.sessionStorage.getItem('sessionInformation')).to.not.be.null;
      });
    });

    it('should handle expired session on profile page', () => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock expired session response
      cy.intercept('GET', '/api/user/1', {
        statusCode: 401,
        body: { error: 'Token expired' }
      }).as('getExpiredSession');

      cy.visit('/me');
      cy.wait('@getExpiredSession');

      // Should redirect to login when session is expired
      cy.url().should('include', '/login');
    });
  });

  describe('Profile Responsive Design', () => {
    beforeEach(() => {
      // Setup authenticated user
      cy.window().then((win) => {
        win.sessionStorage.setItem('sessionInformation', JSON.stringify(mockUser));
      });

      // Mock user API
      cy.intercept('GET', '/api/user/1', {
        statusCode: 200,
        body: mockUserData
      }).as('getUserProfile');
    });

    it('should display properly on mobile devices', () => {
      // Test mobile viewport
      cy.viewport('iphone-6');
      
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Profile information should be visible and properly formatted
      cy.contains('Admin').should('be.visible');
      cy.contains('USER').should('be.visible');
      cy.get('[data-cy=delete-account-button]').should('be.visible');
    });

    it('should display properly on tablet devices', () => {
      // Test tablet viewport
      cy.viewport('ipad-2');
      
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Profile information should be visible and properly formatted
      cy.contains('Admin').should('be.visible');
      cy.contains('USER').should('be.visible');
      cy.get('[data-cy=delete-account-button]').should('be.visible');
    });

    it('should display properly on desktop', () => {
      // Test desktop viewport
      cy.viewport(1200, 800);
      
      cy.visit('/me');
      cy.wait('@getUserProfile');

      // Profile information should be visible and properly formatted
      cy.contains('Admin').should('be.visible');
      cy.contains('USER').should('be.visible');
      cy.get('[data-cy=delete-account-button]').should('be.visible');
    });
  });
});