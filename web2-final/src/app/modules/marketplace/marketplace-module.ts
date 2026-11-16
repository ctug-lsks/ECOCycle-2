import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductList } from './components/product-list/product-list';
import { ProductDetail } from './components/product-detail/product-detail';
import { ProductPost } from './components/product-post/product-post';
import { SellerProducts } from './components/seller-products/seller-products';

@NgModule({
  declarations: [ProductList, ProductDetail, ProductPost, SellerProducts],
  imports: [CommonModule, FormsModule, RouterModule],
  exports: [ProductList, ProductDetail, ProductPost, SellerProducts]
})
export class MarketplaceModule {}
