import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { ToastService } from '../../../../services/toast';
import { environment } from '../../../../../environments/environment';

export interface SellerProductItem {
  id: string;
  title: string;
  img: string;
  categoryName: string;
  cateID: string;
  price: string;
  priceNum: number;
  quantity: number;
  condition: string;
  status: string;
  type: 'ACTIVE_PRODUCT' | 'REQUEST';
  createdAt: string;
}

@Component({
  selector: 'app-seller-products',
  standalone: false,
  templateUrl: './seller-products.html',
  styleUrl: './seller-products.css'
})
export class SellerProducts implements OnInit {
  products: SellerProductItem[] = [];
  filteredProducts: SellerProductItem[] = [];

  isLoading: boolean = true;
  errorMessage: string = '';
  searchTerm: string = '';
  selectedStatus: string = 'ALL';
  selectedCategory: string = 'ALL';

  totalCount: number = 0;
  activeCount: number = 0;
  pendingCount: number = 0;
  soldCount: number = 0;

  selectedProductToDelete: SellerProductItem | null = null;
  isDeleting: boolean = false;

  readonly categories = [
    { id: 'ALL', name: 'Tất cả danh mục' },
    { id: 'c1', name: 'Điện thoại' },
    { id: 'c2', name: 'Laptop' },
    { id: 'c3', name: 'Máy tính bảng' },
    { id: 'c4', name: 'Màn hình' },
    { id: 'c5', name: 'Tai nghe & Phụ kiện' }
  ];

  readonly statuses = [
    { id: 'ALL', label: 'Tất cả trạng thái' },
    { id: 'CON_HANG', label: 'Đang hiển thị bán' },
    { id: 'CHO_DUYET', label: 'Chờ duyệt' },
    { id: 'DA_BAN', label: 'Đã bán / Hết hàng' },
    { id: 'TU_CHOI', label: 'Từ chối' }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (!this.authService.isLoggedIn) {
      this.toastService.showToast('Vui lòng đăng nhập để truy cập Quản lý sản phẩm!', 'warning', 'Yêu cầu đăng nhập');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/quan-ly-san-pham' } });
      return;
    }
    this.fetchSellerProducts();
  }

  fetchSellerProducts(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.http.get<any>(`${environment.apiUrl}/api/seller/my-products`).subscribe({
      next: (res) => {
        this.products = res.products || [];
        this.totalCount = res.totalCount || this.products.length;
        this.activeCount = res.activeCount || 0;
        this.pendingCount = res.pendingCount || 0;
        this.soldCount = res.soldCount || 0;
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải sản phẩm của Seller:', err);
        this.errorMessage = err.error?.message || 'Không thể tải danh sách sản phẩm. Vui lòng thử lại sau!';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const kw = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter(item => {
      const matchKeyword = !kw || 
        (item.title && item.title.toLowerCase().includes(kw)) ||
        (item.id && item.id.toLowerCase().includes(kw));

      const matchCategory = this.selectedCategory === 'ALL' || item.cateID === this.selectedCategory;

      let matchStatus = true;
      const st = (item.status || '').toLowerCase();
      if (this.selectedStatus === 'CON_HANG') {
        matchStatus = st.includes('còn hàng') || st.includes('sẵn có') || st === 'đang bán';
      } else if (this.selectedStatus === 'CHO_DUYET') {
        matchStatus = st.includes('chờ duyệt');
      } else if (this.selectedStatus === 'DA_BAN') {
        matchStatus = st.includes('đã bán') || st.includes('hết hàng');
      } else if (this.selectedStatus === 'TU_CHOI') {
        matchStatus = st.includes('từ chối');
      }

      return matchKeyword && matchCategory && matchStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onCategoryChange(catId: string): void {
    this.selectedCategory = catId;
    this.applyFilter();
  }

  onStatusChange(statusId: string): void {
    this.selectedStatus = statusId;
    this.applyFilter();
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('còn hàng') || s.includes('sẵn có') || s === 'đang bán') return 'badge-active';
    if (s.includes('chờ duyệt')) return 'badge-pending';
    if (s.includes('đã bán') || s.includes('hết hàng')) return 'badge-sold';
    if (s.includes('từ chối')) return 'badge-rejected';
    return 'badge-default';
  }

  openDeleteModal(product: SellerProductItem): void {
    this.selectedProductToDelete = product;
  }

  closeDeleteModal(): void {
    this.selectedProductToDelete = null;
  }

  confirmDelete(): void {
    if (!this.selectedProductToDelete) return;
    this.isDeleting = true;
    const targetId = this.selectedProductToDelete.id;

    this.http.delete<any>(`${environment.apiUrl}/api/seller/products/${targetId}`).subscribe({
      next: (res) => {
        this.isDeleting = false;
        this.toastService.showToast(res.message || 'Đã gỡ sản phẩm thành công!', 'success');
        this.closeDeleteModal();
        this.fetchSellerProducts();
      },
      error: (err) => {
        this.isDeleting = false;
        const msg = err.error?.message || 'Có lỗi khi xóa sản phẩm. Vui lòng thử lại!';
        this.toastService.showToast(msg, 'error');
      }
    });
  }

  navigatePostProduct(): void {
    this.router.navigate(['/dang-ban']);
  }
}
