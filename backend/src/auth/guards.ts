import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
  applyDecorators,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { Request } from "express";

export const Roles = (...roles: string[]) => SetMetadata("roles", roles);
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const roles =
      this.reflector.getAllAndOverride<string[]>("roles", [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (!roles.length) return true;
    const user = context
      .switchToHttp()
      .getRequest<Request & { user?: { role: string } }>().user;
    if (!user) throw new UnauthorizedException();
    if (!roles.includes(user.role))
      throw new ForbiddenException("Insufficient permissions.");
    return true;
  }
}
export const Authenticated = () =>
  applyDecorators(UseGuards(JwtAuthGuard, RolesGuard));
