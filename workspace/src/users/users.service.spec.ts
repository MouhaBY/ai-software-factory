import { UsersService } from "./users.service.js";

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('should return users', () => {
    const result = service.findAll();

    expect(result).toBeDefined();
  });
});