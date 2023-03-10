import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./users.model";
import { Repository } from "typeorm";
import { AddRoleParams, BanUserParams, CreateUserParams, UpdateUserParams } from "../utils/types";
import { RolesService } from "../roles/roles.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UserCreatedEvent } from "./events/user-created.event";

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepository: Repository<User>,
              private roleService: RolesService,
              private eventEmitter: EventEmitter2

  ) {
  }
  public async getUserByEmail(email: string) {
    return this.userRepository.findOne( {where: [{email}], relations: ['posts', 'roles']});
  }
  public async fetchUsers() {
    return await this.userRepository.find({ relations: ['posts', 'roles'] });
  }

  public async createUser(createUserDetails: CreateUserParams) {



    const newUser = this.userRepository.create({
      ...createUserDetails, createdAt: new Date()
    });
    const role = await this.roleService.getRole("ADMIN");
    newUser.roles = [role];

    const userCreatedEvent= new UserCreatedEvent();
    userCreatedEvent.email = newUser.email;
    userCreatedEvent.description = `User with email: ${newUser.email} created`;
    this.eventEmitter.emit('user.created', userCreatedEvent);



    return this.userRepository.save(newUser);
  }

  public updateUser(updateId: number, userDetails: UpdateUserParams) {
    return this.userRepository.update(updateId, { ...userDetails });
  }

  public delete(id: number) {
    return this.userRepository.delete(id);
  }

  public async getUserById(id: number) {
    return await this.userRepository.findOneBy({ id });
  }

  public async addRole(dto: AddRoleParams) {
    const id = dto.userId;
    const user = await this.userRepository.findOneBy({id});
    const role = await this.roleService.getRole(dto.value);
    if(user && role) {
          user.roles.push(role);
          return await this.userRepository.save(user);

    }
    throw new HttpException("User or Role not found", HttpStatus.NOT_FOUND);
  }
  public async banUser(banDetails: BanUserParams) {
    const id = banDetails.userId;
    const user = await this.userRepository.findOneBy({id});
    user.banned = true;
    return this.userRepository.save(user);
  }
}