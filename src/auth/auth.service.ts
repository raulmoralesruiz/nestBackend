import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcryptjs from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload';

@Injectable()
export class AuthService {

  constructor(
    @InjectModel(User.name)
    private userModel: Model<User>,
    private jwtService: JwtService,

  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {   
    
    try {
      // Crear objeto con la contraseña y demás datos del usuario
      const {password, ...userData} = createUserDto;
      
      // Encriptar la contraseña
      const newUser = new this.userModel({
        password: bcryptjs.hashSync(password, 10),
        ...userData
      });
      
      // Guardar el usuario en BBDD
      await newUser.save();

      // Devolver el usuario sin la contraseña
      const { password: _, ...user } = newUser.toJSON();
      return user;
    } catch (error) {
      if (error.code = 11000) {
        throw new BadRequestException(`${createUserDto.email} already exists!`)
      }
      throw new InternalServerErrorException('Something terrible happened!')
    }

  }

  async login(loginDto: LoginDto) {
    const {email, password} = loginDto;

    const user = await this.userModel.findOne({email});
    if ( !user ) {
      throw new UnauthorizedException('Not valid credentials - email');
    }
    if ( !bcryptjs.compareSync(password, user.password) ) {
      throw new UnauthorizedException('Not valid credentials - password');
    }

    const { password: _, ...userData} = user.toJSON();

    return {
      user: userData,
      token: this.getJwt({ id: user.id }),
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  getJwt( payload: JwtPayload ) {
    const token = this.jwtService.sign(payload);
    return token;
  }
}
