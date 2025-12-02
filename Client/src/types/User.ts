export interface User {
  id: string;
  userName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateUserDto {
  userName?: string;
  firstName?: string;
  lastName?: string;
  profileImage?: string;
}
