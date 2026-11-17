import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ProductService } from '../../services/product';
import { Category } from '../../../../classes/category';
import { Product } from '../../../../classes/product';
import { createSlug } from '../../../../classes/slug-helper';

@Component({
  selector: 'app-product-list',
  standalone: false,
  styleUrl: './product-list.css',
  templateUrl: './product-list.html',
})
export class ProductList implements OnInit {
  readonly fallbackImage = '/assets/ecocycle-logo.svg';
  public createSlug = createSlug;
  categories: Category[] = [];
  allProducts: Product[] = [];
  displayedProducts: Product[] = [];
  
  selectedCateId: string = '';
  searchKeyword: string = '';
  selectedSort: string = 'all';
  
  minPrice: number | null = null;
  maxPrice: number | null = null;
  
  selectedConditions: string[] = [];
  
  availableProvinces: string[] = [
    'TP. Hồ Chí Minh',
    'TP. Hà Nội',
    'TP. Hải Phòng',
    'TP. Đà Nẵng',
    'TP. Cần Thơ',
    'TP. Huế',
    'TP. Đồng Nai',
    'An Giang',
    'Bắc Ninh',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Điện Biên',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Tĩnh',
    'Hưng Yên',
    'Khánh Hòa',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Nghệ An',
    'Ninh Bình',
    'Phú Thọ',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sơn La',
    'Tây Ninh',
    'Thái Nguyên',
    'Thanh Hóa',
    'Tuyên Quang',
    'Vĩnh Long'
  ];
  selectedLocations: string[] = [];

  currentPage: number = 1;
  pageSize: number = 50;
  totalPages: number = 1;
  pagesArray: number[] = [1];

  isLoading: boolean = true;
  errorMessage: string = '';

  constructor(
    private _productService: ProductService,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllProducts();

    this._productService.searchKeyword$.subscribe({
      next: (kw) => {
        this.searchKeyword = kw;
        this.extractAllProducts();
        this._cdr.detectChanges();
      }
    });
  }

  normalizeProvince(addrOrLoc: string): string {
    if (!addrOrLoc) return 'TP. Hồ Chí Minh';
    const a = addrOrLoc.toLowerCase().trim();

    if (a.includes('hồ chí minh') || a.includes('hcm') || a.includes('bình dương') || a.includes('vũng tàu') || a.includes('bà rịa') || a.includes('sài gòn') || a.includes('sai gon')) return 'TP. Hồ Chí Minh';
    if (a.includes('hà nội') || a.includes('ha noi') || a === 'hn') return 'TP. Hà Nội';
    if (a.includes('đà nẵng') || a.includes('da nang') || a.includes('quảng nam') || a.includes('quang nam')) return 'TP. Đà Nẵng';
    if (a.includes('hải phòng') || a.includes('hai phong') || a.includes('hải dương') || a.includes('hai duong')) return 'TP. Hải Phòng';
    if (a.includes('cần thơ') || a.includes('can tho') || a.includes('hậu giang') || a.includes('sóc trăng')) return 'TP. Cần Thơ';
    if (a.includes('huế') || a.includes('hue') || a.includes('thừa thiên')) return 'TP. Huế';
    if (a.includes('đồng nai') || a.includes('dong nai') || a.includes('bình phước') || a.includes('binh phuoc')) return 'TP. Đồng Nai';
    if (a.includes('lâm đồng') || a.includes('đắk nông') || a.includes('bình thuận')) return 'Lâm Đồng';
    if (a.includes('tây ninh') || a.includes('long an')) return 'Tây Ninh';
    if (a.includes('đồng tháp') || a.includes('tiền giang')) return 'Đồng Tháp';
    if (a.includes('vĩnh long') || a.includes('bến tre') || a.includes('trà vinh')) return 'Vĩnh Long';
    if (a.includes('an giang') || a.includes('kiên giang')) return 'An Giang';
    if (a.includes('cà mau') || a.includes('bạc liêu')) return 'Cà Mau';
    if (a.includes('khánh hòa') || a.includes('ninh thuận') || a.includes('nha trang')) return 'Khánh Hòa';
    if (a.includes('gia lai') || a.includes('bình định') || a.includes('quy nhơn')) return 'Gia Lai';
    if (a.includes('đắk lắk') || a.includes('dak lak') || a.includes('phú yên') || a.includes('buôn ma thuột')) return 'Đắk Lắk';
    if (a.includes('quảng ngãi') || a.includes('kon tum')) return 'Quảng Ngãi';
    if (a.includes('quảng trị') || a.includes('quảng bình')) return 'Quảng Trị';
    if (a.includes('hưng yên') || a.includes('thái bình')) return 'Hưng Yên';
    if (a.includes('ninh bình') || a.includes('nam định') || a.includes('hà nam')) return 'Ninh Bình';
    if (a.includes('bắc ninh') || a.includes('bắc giang')) return 'Bắc Ninh';
    if (a.includes('phú thọ') || a.includes('vĩnh phúc') || a.includes('hòa bình')) return 'Phú Thọ';
    if (a.includes('thái nguyên') || a.includes('bắc kạn')) return 'Thái Nguyên';
    if (a.includes('lào cai') || a.includes('yên bái')) return 'Lào Cai';
    if (a.includes('tuyên quang') || a.includes('hà giang')) return 'Tuyên Quang';
    if (a.includes('điện biên')) return 'Điện Biên';
    if (a.includes('sơn la')) return 'Sơn La';
    if (a.includes('lạng sơn')) return 'Lạng Sơn';
    if (a.includes('hà tĩnh')) return 'Hà Tĩnh';
    if (a.includes('nghệ an')) return 'Nghệ An';
    if (a.includes('thanh hóa')) return 'Thanh Hóa';
    if (a.includes('cao bằng')) return 'Cao Bằng';
    if (a.includes('quảng ninh')) return 'Quảng Ninh';
    if (a.includes('lai châu')) return 'Lai Châu';

    return 'TP. Hồ Chí Minh';
  }

  loadAllProducts(): void {
    this.isLoading = true;
    this.selectedCateId = '';
    console.log('[ProductList] Đang gọi getProducts()...');
    this._productService.getProducts().subscribe({
      next: (data) => {
        console.log('[ProductList] Nhận dữ liệu thành công từ Server:', data);
        const rawCategories = data || [];
        this.categories = rawCategories.map((cat: any) => ({
          ...cat,
          Products: (cat.Products || []).map((p: any) => ({
            ...p,
            sellerLocation: this.normalizeProvince(p.sellerLocation || (p.sellerInfo && p.sellerInfo.address) || '')
          }))
        }));
        this.extractAllProducts();
        this.isLoading = false;
        this._cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ProductList] Lỗi gọi API:', err);
        this.errorMessage = 'Không thể tải dữ liệu từ MongoDB Server! Vui lòng bật "node index.js" ở folder database-mongodb';
        this.isLoading = false;
        this._cdr.detectChanges();
      }
    });
  }

  toggleCondition(conditionValue: string): void {
    const index = this.selectedConditions.indexOf(conditionValue);
    if (index > -1) {
      this.selectedConditions.splice(index, 1);
    } else {
      this.selectedConditions.push(conditionValue);
    }
    this.extractAllProducts();
  }

  toggleLocation(locationValue: string): void {
    const index = this.selectedLocations.indexOf(locationValue);
    if (index > -1) {
      this.selectedLocations.splice(index, 1);
    } else {
      this.selectedLocations.push(locationValue);
    }
    this.extractAllProducts();
  }

  extractAllProducts(): void {
    let list: Product[] = [];
    if (this.selectedCateId) {
      const cat = this.categories.find(c => c.CateID === this.selectedCateId);
      if (cat) list = [...cat.Products];
    } else {
      this.categories.forEach(cat => {
        if (cat.Products) {
          list = list.concat(cat.Products);
        }
      });
    }

    list = list.filter(p => p.Status !== 'Đã bán');

    if (this.searchKeyword.trim()) {
      const kw = this.searchKeyword.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(kw));
    }

    if (this.minPrice !== null && this.minPrice > 0) {
      list = list.filter(p => this.parsePrice(p.fromPrice) >= (this.minPrice! * 1000000));
    }
    if (this.maxPrice !== null && this.maxPrice > 0) {
      list = list.filter(p => this.parsePrice(p.fromPrice) <= (this.maxPrice! * 1000000));
    }

    if (this.selectedConditions.length > 0) {
      list = list.filter(p => {
        if (!p.condition) return false;
        const cond = p.condition.toLowerCase().trim();
        return this.selectedConditions.some(sc => {
          if (sc === 'Mới') {
            return cond === 'mới' || cond === 'moi' || cond.includes('mới 100%') || cond.includes('mới tinh') || cond.includes('nguyên seal');
          }
          if (sc === 'Mới 80-99%') {
            return cond.includes('99%') || cond.includes('98%') || cond.includes('97%') || cond.includes('96%') || cond.includes('95%') || cond.includes('90%') || cond.includes('85%') || cond.includes('80%') || cond.includes('likenew') || cond.includes('like new');
          }
          if (sc === 'Đã qua sử dụng') {
            return cond.includes('đã sử dụng') || cond.includes('da su dung') || cond.includes('cũ') || cond.includes('đã qua sử dụng');
          }
          return false;
        });
      });
    }

    if (this.selectedLocations.length > 0) {
      list = list.filter(p => {
        const prodNormalized = p.sellerLocation || this.normalizeProvince(p.sellerInfo?.address || '');
        return this.selectedLocations.some(sl => {
          if (prodNormalized === sl) return true;
          const cleanSl = sl.replace(/^tp\.\s*/i, '').toLowerCase();
          const cleanLoc = (p.sellerLocation || '').toLowerCase();
          const cleanAddr = (p.sellerInfo?.address || '').toLowerCase();
          const cleanDesc = (p.Description || '').toLowerCase();
          return cleanLoc.includes(cleanSl) || cleanAddr.includes(cleanSl) || cleanDesc.includes(cleanSl);
        });
      });
    }

    if (this.selectedSort === 'price-asc') {
      list.sort((a, b) => this.parsePrice(a.fromPrice) - this.parsePrice(b.fromPrice));
    } else if (this.selectedSort === 'price-desc') {
      list.sort((a, b) => this.parsePrice(b.fromPrice) - this.parsePrice(a.fromPrice));
    }

    this.allProducts = list;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters(): void {
    this.minPrice = null;
    this.maxPrice = null;
    this.selectedConditions = [];
    this.selectedLocations = [];
    this.selectedCateId = '';
    this.searchKeyword = '';
    this.selectedSort = 'all';
    this._productService.setSearchKeyword('');
    this.extractAllProducts();
  }

  parsePrice(priceStr: string): number {
    if (!priceStr) return 0;
    const num = priceStr.replace(/[^0-9]/g, '');
    return parseInt(num, 10) || 0;
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.allProducts.length / this.pageSize) || 1;
    this.pagesArray = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedProducts = this.allProducts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  filterByCategory(cateId: string): void {
    this.selectedCateId = cateId;
    this.extractAllProducts();
  }

  setSort(sortType: string): void {
    this.selectedSort = sortType;
    this.extractAllProducts();
  }

  onSearch(): void {
    this.extractAllProducts();
  }

  scrollCategoriesLeft(): void {
    const el = document.getElementById('categoryScrollContainer');
    if (el) {
      el.scrollBy({ left: -300, behavior: 'smooth' });
    }
  }

  scrollCategoriesRight(): void {
    const el = document.getElementById('categoryScrollContainer');
    if (el) {
      el.scrollBy({ left: 300, behavior: 'smooth' });
    }
  }

  onProductImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    if (image.src.endsWith(this.fallbackImage)) return;
    image.src = this.fallbackImage;
  }
}
