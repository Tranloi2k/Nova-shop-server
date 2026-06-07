import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

import { UserService } from '../user/user.service';
import removeKeyObject from '../helpers';
import { LoginResponseDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  /*
   |--------------------------------------------------------------------------
   | VALIDATE USER
   |--------------------------------------------------------------------------
   */

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<LoginResponseDto, 'password'> | null> {
    // Chỉ định rõ ràng selectPassword = true để lấy password hash từ DB phục vụ validate
    const user = await this.userService.findUserByEmail(email, true);
    if (user && (await bcrypt.compare(password, user.password))) {
      return removeKeyObject(user, 'password');
    }
    return null;
  }

  async validateUserById(id: number) {
    const user = await this.userService.findUserById(id);

    if (!user) {
      return null;
    }

    return removeKeyObject(user, 'password');
  }

  /*
   |--------------------------------------------------------------------------
   | TOKEN GENERATORS
   |--------------------------------------------------------------------------
   */

  private async generateAccessToken(username: string, userId: number) {
    return this.jwtService.signAsync(
      {
        username,
        sub: userId,
      },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET') || this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  private async generateRefreshToken(username: string, userId: number) {
    return this.jwtService.signAsync(
      {
        username,
        sub: userId,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
        expiresIn: '7d',
      },
    );
  }

  /*
   |--------------------------------------------------------------------------
   | LOGIN
   |--------------------------------------------------------------------------
   */

  async login(username: string, userId: number) {
    const accessToken = await this.generateAccessToken(username, userId);

    const refreshToken = await this.generateRefreshToken(username, userId);

    // Hash refresh token trước khi lưu DB
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.userService.updateUser(userId, {
      refreshToken: hashedRefreshToken,
    });

    return {
      userId,
      accessToken,
      refreshToken,
    };
  }

  /*
   |--------------------------------------------------------------------------
   | REFRESH TOKEN
   |--------------------------------------------------------------------------
   */

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: number;
        username: string;
      }>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.userService.findUserById(payload.sub);

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);

      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Refresh token rotation
      return this.login(user.username, user.id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new UnauthorizedException('Refresh token expired or invalid');
    }
  }

  async logout(userId: number) {
    await this.userService.updateUser(userId, {
      refreshToken: '',
    });

    return {
      message: 'Logout successful',
    };
  }

  async googleLogin(googleToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken: googleToken,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });

    const payload = ticket.getPayload() as TokenPayload;

    if (!payload || !payload.email || !payload.name) {
      throw new UnauthorizedException('Invalid Google token');
    }

    let user = await this.userService.findUserByEmail(payload.email);

    if (!user) {
      // Tạo mật khẩu ngẫu nhiên có độ bảo mật cao để tránh lỗi đăng nhập mật khẩu trống
      const randomSecurePassword = crypto.randomBytes(32).toString('hex');
      user = await this.userService.createUser(payload.name, payload.email, randomSecurePassword);
    }

    return this.login(user.username, user.id);
  }
}
