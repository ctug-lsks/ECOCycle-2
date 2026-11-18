import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import {
  ChatService,
  ChatConversation,
  ChatMessage
} from '../../services/chat-service';

import { AuthService } from '../../../../services/auth.service';
import { getAvatarUrl } from '../../../../utils/avatar.util';

@Component({
  selector: 'app-chat-page',
  standalone: false,
  templateUrl: './chat-page.html',
  styleUrl: './chat-page.css'
})
export class ChatPageComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessagesContainer')
  chatMessagesContainer?: ElementRef<HTMLDivElement>;
  conversations: ChatConversation[] = [];
  messages: ChatMessage[] = [];

  selectedConversation: ChatConversation | null = null;
  messageInput = '';
  supportTopics = [
    {
      id: 'order',
      label: 'Đơn hàng',
      icon: 'https://cdn-icons-png.flaticon.com/512/6815/6815043.png'
    },
    {
      id: 'coins',
      label: 'GreenCoins',
      icon: 'https://cdn-icons-png.flaticon.com/128/1490/1490853.png'
    },
    {
      id: 'account',
      label: 'Tài khoản',
      icon: 'https://cdn-icons-png.flaticon.com/512/5582/5582872.png'
    },
    {
      id: 'report',
      label: 'Báo cáo vi phạm',
      icon: 'https://cdn-icons-png.flaticon.com/128/2058/2058160.png'
    },
    {
      id: 'admin',
      label: 'Chat với ADMIN',
      icon: 'https://cdn-icons-png.flaticon.com/128/9408/9408175.png'
    }
  ];

  sendingSupportTopic = false;
  showSupportTopics = false;

  selectedImage: File | null = null;
  imagePreview: string | null = null;
  uploadingImage = false;

  imageUrls: Record<string, string> = {};
  previewImageUrl: string | null = null;

  openImagePreview(imageUrl: string): void {
    this.previewImageUrl = imageUrl;
  }

  closeImagePreview(): void {
    this.previewImageUrl = null;
  }
  private imageObjectUrls: string[] = [];

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'Chỉ chọn ảnh JPG, PNG, WEBP, GIF tối đa 5MB.';
      input.value = '';
      return;
    }

    this.selectedImage = file;

    if (this.imagePreview) {
      URL.revokeObjectURL(this.imagePreview);
    }

    this.imagePreview = URL.createObjectURL(file);
    input.value = '';
  }

  removeSelectedImage(): void {
    if (this.imagePreview) URL.revokeObjectURL(this.imagePreview);

    this.selectedImage = null;
    this.imagePreview = null;
  }

  sendImage(): void {
    const conversationID = this.selectedConversation?._id;

    if (!conversationID || !this.selectedImage || this.uploadingImage) return;

    this.uploadingImage = true;
    this.errorMessage = '';

    this.chatService.uploadImage(conversationID, this.selectedImage).subscribe({
      next: message => {
        this.uploadingImage = false;
        this.removeSelectedImage();

        if (this.selectedConversation?._id === conversationID &&
            !this.messages.some(item => item._id === message._id)) {
          this.messages = [...this.messages, message];
          this.loadMessageImage(message);
        }

        this.loadConversations();
        this.cdr.detectChanges();
      },
      error: error => {
        this.uploadingImage = false;
        this.errorMessage =
          error.error?.message || 'Không thể gửi hình ảnh.';
        this.cdr.detectChanges();
      }
    });
  }

  loadMessageImage(message: ChatMessage): void {
    if (!message.imageUrl || this.imageUrls[message._id]) return;

    this.chatService.getChatImage(message.imageUrl).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        this.imageUrls[message._id] = url;
        this.imageObjectUrls.push(url);
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Không thể tải một hình ảnh.';
        this.cdr.detectChanges();
      }
    });
  }

  loading = false;
  sending = false;
  errorMessage = '';
  openingSupport = false;

  private readonly messageHandler = (message: ChatMessage) => {
    if (message.conversationID === this.selectedConversation?._id) {
      if (!this.messages.some(item => item._id === message._id)) {
        this.messages = [...this.messages, message];
      }
    }

    this.loadConversations();
    this.loadMessageImage(message);
    this.cdr.detectChanges();
  };

  constructor(
    private chatService: ChatService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  returnUrl: string | null = null;

    goBackToProduct(): void {
      if (!this.returnUrl) return;

      this.router.navigateByUrl(this.returnUrl);
    }

  ngOnInit(): void {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');

    this.returnUrl =
      url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')
        ? url
        : null;
        
    if (!this.authService.token) {
      this.errorMessage = 'Vui lòng đăng nhập để sử dụng tin nhắn.';
      return;
    }

    this.chatService.connect();
    this.chatService.onMessage(this.messageHandler);
    this.loadConversations();
  }

  ngOnDestroy(): void {
    this.chatService.offMessage(this.messageHandler);
    this.chatService.disconnect();
    this.removeSelectedImage();
    this.imageObjectUrls.forEach(url => URL.revokeObjectURL(url));
  }

  loadConversations(): void {
    this.loading = true;

    this.chatService.getConversations().subscribe({
      next: data => {
        this.loading = false;

        const conversationID =
          this.route.snapshot.queryParamMap.get('conversationID');

        const fromProduct =
          !!this.route.snapshot.queryParamMap.get('returnUrl');

        this.conversations = fromProduct && conversationID
          ? [
              ...data.filter(item => item._id === conversationID),
              ...data.filter(item => item._id !== conversationID)
            ]
          : data;

        if (conversationID) {
          const conversation = data.find(
            item => item._id === conversationID
          );

          if (
            conversation &&
            this.selectedConversation?._id !== conversation._id
          ) {
            this.selectConversation(conversation);
          }
        }

        this.cdr.detectChanges();
      },

      error: () => {
        this.errorMessage = 'Không thể tải danh sách cuộc trò chuyện.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
  scrollToBottom(): void {
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      const container = this.chatMessagesContainer?.nativeElement;

      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  }
  openSupportChat(): void {
    if (this.openingSupport) return;

    this.openingSupport = true;
    this.errorMessage = '';

    this.chatService.createSupportConversation().subscribe({
      next: conversation => {
        this.openingSupport = false;

        this.loadConversations();
        this.selectConversation(conversation);
        this.showSupportTopics = true;
        this.scrollToBottom();

        this.cdr.detectChanges();
      },

      error: error => {
        this.openingSupport = false;

        this.errorMessage =
          error.error?.message ||
          'Không thể mở cuộc trò chuyện hỗ trợ.';

        this.cdr.detectChanges();
      }
    });
  }
  selectSupportTopic(topicID: string): void {
    const conversation = this.selectedConversation;

    if (!conversation || conversation.type !== 'support') {
      return;
    }

    if (this.sendingSupportTopic) {
      return;
    }

    this.sendingSupportTopic = true;
    this.errorMessage = '';

    this.chatService.sendSupportTopic(
      conversation._id,
      topicID
    ).subscribe({
      next: () => {
        this.sendingSupportTopic = false;
        this.showSupportTopics = false;

        const conversation = this.selectedConversation;

        if (conversation) {
          this.chatService.getMessages(conversation._id).subscribe({
            next: data => {
              if (this.selectedConversation?._id !== conversation._id) return;

              this.messages = data;
              this.messages.forEach(message => this.loadMessageImage(message));
              this.scrollToBottom();
            },
            error: () => {
              this.errorMessage = 'Không thể tải câu trả lời hỗ trợ.';
              this.cdr.detectChanges();
            }
          });
        }

        this.cdr.detectChanges();
      },

      error: error => {
        this.sendingSupportTopic = false;
        this.errorMessage =
          error.error?.message || 'Không thể xử lý chủ đề hỗ trợ.';
        this.cdr.detectChanges();
      }
    });
  }

  selectConversation(conversation: ChatConversation): void {
    this.selectedConversation = conversation;
    this.messages = [];
    this.errorMessage = '';

    this.chatService.joinConversation(conversation._id, result => {
      if (!result.ok) {
        this.errorMessage = 'Không thể tham gia cuộc trò chuyện.';
        this.cdr.detectChanges();
      }
    });

    this.chatService.getMessages(conversation._id).subscribe({
      next: data => {
        if (this.selectedConversation?._id === conversation._id) {
          const existingIds = new Set(data.map(item => item._id));
          const newerMessages = this.messages.filter(
            item => !existingIds.has(item._id)
          );

          this.messages = [...data, ...newerMessages];
          this.messages.forEach(message => this.loadMessageImage(message));
          this.scrollToBottom();
        }
      },
      error: () => {
        this.errorMessage = 'Không thể tải lịch sử tin nhắn.';
        this.cdr.detectChanges();
      }
    });
  }

  onMessageEnter(event: Event): void {
    event.preventDefault();

    const keyboardEvent = event as KeyboardEvent;

    if (keyboardEvent.isComposing) {
      return;
    }

    this.submitMessage();
  }
  onMessageInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.messageInput = input.value;
    this.cdr.detectChanges();
  }
  submitMessage(): void {
    if (this.uploadingImage || this.sending) return;

    if (this.selectedImage) {
      this.sendImage();
    } else {
      this.sendMessage();
    }
  }

  sendMessage(): void {
    const content = this.messageInput.trim();
    const conversationID = this.selectedConversation?._id;

    if (!content || !conversationID || this.sending) return;

    this.sending = true;
    this.errorMessage = '';

    this.chatService.sendMessage(conversationID, content, result => {
      this.sending = false;

      if (result?.ok) {
        this.messageInput = '';
      } else {
        this.errorMessage =
          typeof result?.message === 'string'
            ? result.message
            : 'Gửi tin nhắn thất bại.';
      }

      this.cdr.detectChanges();
    });
  }

  getOtherUserID(conversation: ChatConversation): string {
    const myID = String(
      (this.authService.currentUser as any)?.userID || ''
    );
    const isAdmin = (this.authService.currentUser as any)?.role === 'ADMIN';

    if (conversation.type === 'support' && isAdmin) {
      if (conversation.customerID && String(conversation.customerID) !== myID) {
        return conversation.customerID;
      }
      const otherPerson = (conversation.participants || []).find(
        id => String(id) !== myID
      );
      if (otherPerson) return otherPerson;
    }

    return (conversation.participants || []).find(
      id => String(id) !== myID
    ) || 'Người dùng';
  }

  getOtherUserName(conversation: ChatConversation): string {
    const isAdmin = (this.authService.currentUser as any)?.role === 'ADMIN';

    if (conversation.type === 'support') {
      if (!isAdmin) {
        return 'Hỗ trợ EcoCycle';
      }
      const customerID = this.getOtherUserID(conversation);
      const name = conversation.participantNames?.[customerID];
      if (name && name !== customerID) return name;
      return name || customerID || 'Khách hàng';
    }

    const otherUserID = this.getOtherUserID(conversation);
    return conversation.participantNames?.[otherUserID] || otherUserID;
  }

  getOtherUserAvatar(conversation: ChatConversation): string {
    const isAdmin = (this.authService.currentUser as any)?.role === 'ADMIN';

    if (conversation.type === 'support') {
      if (!isAdmin) {
        return 'https://cdn-icons-png.flaticon.com/128/12441/12441159.png';
      }
      const customerID = this.getOtherUserID(conversation);
      const name = this.getOtherUserName(conversation);
      return getAvatarUrl(
        conversation.participantAvatars?.[customerID],
        name,
        customerID
      );
    }

    const otherUserID = this.getOtherUserID(conversation);
    const otherUserName = this.getOtherUserName(conversation);
    return getAvatarUrl(
      conversation.participantAvatars?.[otherUserID],
      otherUserName,
      otherUserID
    );
  }

  getMessageSenderAvatar(message: ChatMessage): string {
    if (!this.selectedConversation) {
      return getAvatarUrl(null, 'Người dùng');
    }

    if (this.selectedConversation.type === 'support') {
      const isAdmin = (this.authService.currentUser as any)?.role === 'ADMIN';
      const myID = String((this.authService.currentUser as any)?.userID || '');
      if (!isAdmin && String(message.senderID) !== myID) {
        return 'https://cdn-icons-png.flaticon.com/128/12441/12441159.png';
      }
    }

    const senderID = String(message.senderID);
    const senderName = this.getMessageSenderName(message);
    const avatar = this.selectedConversation.participantAvatars?.[senderID];
    return getAvatarUrl(avatar, senderName, senderID);
  }

  getMessageSenderName(message: ChatMessage): string {
    if (!this.selectedConversation) return '';

    if (this.selectedConversation.type === 'support') {
      const isAdmin = (this.authService.currentUser as any)?.role === 'ADMIN';
      if (!isAdmin) {
        return 'Hỗ trợ EcoCycle';
      }
    }

    return (
      this.selectedConversation.participantNames?.[message.senderID] ||
      this.getOtherUserName(this.selectedConversation)
    );
  }

  isMyMessage(message: ChatMessage): boolean {
    const myID = String(
      (this.authService.currentUser as any)?.userID || ''
    );

    return String(message.senderID) === myID;
  }
  conversationSearch = '';

  get filteredConversations() {
    const keyword = this.conversationSearch.trim().toLowerCase();
    const isAdmin = (this.authService.currentUser as any)?.role === 'ADMIN';

    const availableConversations = this.conversations.filter(conversation => {
      if (conversation.type === 'support') {
        return isAdmin;
      }
      return true;
    });

    if (!keyword) {
      return availableConversations;
    }

    return availableConversations.filter(conversation => {
      const userName = this.getOtherUserName(conversation).toLowerCase();
      const userID = this.getOtherUserID(conversation).toLowerCase();
      const lastMessage = String(conversation.lastMessage ?? '').toLowerCase();

      return (
        userName.includes(keyword) ||
        userID.includes(keyword) ||
        lastMessage.includes(keyword)
      );
    });
  }
}
