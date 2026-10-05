import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersService {
    findAll() {
        return ["m", "b", "c", "r", "f", "f", "d", "z", "e", "r", 't'];
    }
}
