const { registerUser, getUserInfo, updateUser, verifyEmail } = require('../controllers/userController');
const User = require('../models/userModel');
jest.mock('../models/userModel');
const { statsdClient, logger } = require('../stats');
jest.mock('../stats');

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = { body: { firstName: '', lastName: '', email: '', password: '' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ code: 400 });
    });

    it('should create a user and return 201', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        id: 'user-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        account_created: new Date(),
        account_updated: new Date(),
      });

      const req = { body: { firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com', password: 'password' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await registerUser(req, res);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'john.doe@example.com' } });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' }));
    });
  });

  describe('getUserInfo', () => {
    it('should return 404 if user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      const req = { user: { email: 'john.doe@example.com' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getUserInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ code: 404 });
    });

    it('should return user information', async () => {
      User.findOne.mockResolvedValue({
        id: 'user-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        account_created: new Date(),
        account_updated: new Date(),
      });

      const req = { user: { email: 'john.doe@example.com' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await getUserInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'John', lastName: 'Doe', email: 'john.doe@example.com' }));
    });
  });

  describe('updateUser', () => {
    it('should return 404 if user is not found', async () => {
      User.findOne.mockResolvedValue(null);

      const req = { user: { email: 'john.doe@example.com' }, body: { firstName: 'John', lastName: 'Doe', password: 'password' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateUser(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ code: 404 });
    });

    it('should update user information', async () => {
      const mockUser = {
        save: jest.fn(),
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        account_updated: new Date(),
      };
      User.findOne.mockResolvedValue(mockUser);

      const req = { user: { email: 'john.doe@example.com' }, body: { firstName: 'Jane', lastName: 'Smith', password: 'newpassword' } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await updateUser(req, res);

      expect(mockUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });
});
