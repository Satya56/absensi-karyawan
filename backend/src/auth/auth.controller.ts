import { Body, Controller, Post, Req } from "@nestjs/common";
import { RequestWithId, logOperationalEvent } from "../common/operational-logging";
import { IsEmail, IsString, MinLength } from "class-validator";
import { AuthService } from "./auth.service";

class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}
@Controller("auth")
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post("login") async login(@Body() dto: LoginDto, @Req() req: RequestWithId) {
    const result = await this.auth.login(dto.email, dto.password);
    logOperationalEvent("info", "auth.login.succeeded", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
  }
}
