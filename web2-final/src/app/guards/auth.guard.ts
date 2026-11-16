import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard bảo vệ các trang yêu cầu đăng nhập (Profile, Đơn hàng, Đăng bán, Thanh toán, Tin nhắn...)
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn) {
    return true;
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

/**
 * Guard chỉ cho phép quyền ADMIN truy cập các trang quản trị
 */
export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.hasRole('ADMIN')) {
    return true;
  }

  if (!authService.isLoggedIn) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  } else {
    // Đã đăng nhập nhưng không phải ADMIN -> điều hướng về trang mua hàng
    router.navigate(['/mua-hang']);
  }
  return false;
};

/**
 * Guard chỉ cho phép quyền SELLER hoặc ADMIN truy cập Quản lý sản phẩm người bán
 */
export const sellerGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn && authService.hasRole('SELLER', 'ADMIN')) {
    return true;
  }

  if (!authService.isLoggedIn) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  } else {
    router.navigate(['/mua-hang']);
  }
  return false;
};
