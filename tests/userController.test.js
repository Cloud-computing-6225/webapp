const {
  registerUser,
  getUserInfo,
  updateUser,
} = require("../controllers/userController");
const User = require("../models/userModel");


jest.mock("../models/userModel"); 

describe("User Controller Tests", () => {
  // Test for registerUser 
  describe("registerUser", () => {
    const mockReq = {
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "johndoe@test.com",
        password: "password123",
      },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn(),
    };

    it("should return 400 if required fields are missing", async () => {
      const req = {
        body: { firstName: "", lastName: "Doe", email: "", password: "" },
      };
      await registerUser(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should return 400 if additional params are present", async () => {
      const req = {
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "johndoe@test.com",
          password: "password",
          extraParam: "extra",
        },
      };
      await registerUser(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should return 400 for invalid email format", async () => {
      const req = {
        body: {
          firstName: "John",
          lastName: "Doe",
          email: "invalidemail",
          password: "password123",
        },
      };
      await registerUser(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should return 400 if user already exists", async () => {
      User.findOne.mockResolvedValue({ email: "johndoe@test.com" }); 
      await registerUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should create a new user if valid data is provided", async () => {
      // No existing user
      User.findOne.mockResolvedValue(null); 
      
      User.create.mockResolvedValue({
        id: "mocked-id", 
        firstName: "John",
        lastName: "Doe",
        email: "johndoe@test.com",
        password: "samplePassword",
        account_created: new Date().toISOString(),
        account_updated: new Date().toISOString(), 
      });

      await registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: expect.any(String), 
        firstName: "John",
        lastName: "Doe",
        email: "johndoe@test.com",
        account_created: expect.any(String), 
        account_updated: expect.any(String), 
      });
    });

    it("should return 500 on error", async () => {
      
      User.findOne.mockRejectedValue(new Error("Database error"));

      await registerUser(mockReq, mockRes);


      expect(mockRes.status).toHaveBeenCalledWith(500); 
      expect(mockRes.end).toHaveBeenCalled(); 
    });
  });

  // Test for getUserInfo 
  describe("getUserInfo", () => {
    const mockReq = {
 
    user: { email: "nonexistent@example.com" }
    };
// 
    it("should return 404 if user is not found", async () => {
      
      User.findOne.mockResolvedValue(null);

    
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        end: jest.fn(),
      };

      await getUserInfo(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404); 
      expect(mockRes.end).toHaveBeenCalled(); 
      
    });
    it("should return user information if user exists", async () => {
        const mockUser = {
          id: "uuid123",
          firstName: "John",
          lastName: "Doe",
          email: "johndoe@test.com",
          account_created: new Date().toISOString(), 
          account_updated: new Date().toISOString(), 
        };
        
        // Mock User.findOne to return the mock user
        User.findOne.mockResolvedValue(mockUser);
        
       
        const mockReq = {
          user: {
            email: "johndoe@test.com",
          
          },
        };
      
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          end: jest.fn(),
        };
      
        await getUserInfo(mockReq, mockRes);
      
        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith({
          id: mockUser.id,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          account_created: expect.any(String), 
          account_updated: expect.any(String), 
        });
      });
      

    it("should return 500 on error", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        end: jest.fn(),
      };
      await getUserInfo(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  // Test for updateUser (requires Basic Authentication)
  describe("updateUser", () => {
    const mockReq = {
      headers: {
        authorization: "Basic am9obmRvZUB0ZXN0LmNvbTpwYXNzd29yZDEyMw==",
      }, 
      body: { firstName: "John", lastName: "Doe", password: "password123" },
    };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn(),
    };

    it("should return 400 if required fields are missing", async () => {
      const req = {
        headers: {
          authorization: "Basic am9obmRvZUB0ZXN0LmNvbTpwYXNzd29yZDEyMw==",
        },
        body: { firstName: "", lastName: "Doe", password: "" },
      };
      await updateUser(req, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should return 404 if user is not found", async () => {
        // Mock the response from User.findOne to return null
        User.findOne.mockResolvedValue(null);
      
        // Mock request object with user info (email) to look up
        const mockReq = {
          user: {
            email: "nonexistentuser@test.com", 
          },
        };
      
        const mockRes = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          end: jest.fn(),
        };
      
        await getUserInfo(mockReq, mockRes); 
      
        expect(mockRes.status).toHaveBeenCalledWith(404); // Expect a 404 status
       
        expect(mockRes.end).toHaveBeenCalled(); // Ensure the response ends
      });
      

      it("should update user information if all valid data is provided", async () => {
        const mockUser = {
          id: "uuid123",
          firstName: "John",
          lastName: "Doe",
          email: "johndoe@test.com",
          password: "oldPassword",
          save: jest.fn().mockResolvedValue(true), 
        };
      
        // Mock User.findOne to return the mock user
        User.findOne.mockResolvedValue(mockUser);
      
        // Mock request with user data to update
        const mockReq = {
          user: { email: "johndoe@test.com" }, 
          body: { // Data to update
            firstName: "Jane",
            lastName: "Doe",
            password: "newPassword", 
          },
        };
      
        // Call the function to update user information
        await updateUser(mockReq, mockRes);
      
        // Verify that save was called to persist changes
        expect(mockUser.save).toHaveBeenCalled();
        expect(mockRes.status).toHaveBeenCalledWith(204); 

        expect(mockRes.end).toHaveBeenCalled(); 
        
      });
      

    it("should return 500 on error", async () => {
      User.findOne.mockRejectedValue(new Error("Database error"));
      await updateUser(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });
});
