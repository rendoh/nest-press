import { IsString, Length, IsEmail, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(4, 32)
  readonly name!: string;

  @IsString()
  @IsEmail()
  readonly email!: string;

  @IsString()
  @Length(8, 32)
  @Matches(/^[a-zA-Z0-9!-/:-@¥[-`{-~]*$/)
  readonly password!: string;
}
