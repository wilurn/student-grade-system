# Student Grade Management System

ระบบจัดการเกรดนักเรียนที่พัฒนาด้วย React.js และ TypeScript โดยใช้หลักการ Clean Architecture

## 🌟 คุณสมบัติหลัก

- **การจัดการเกรด**: ดูเกรดทั้งหมดของนักเรียนแยกตามรายวิชา
- **การขอแก้ไขเกรด**: ส่งคำขอแก้ไขเกรดพร้อมเหตุผลและเอกสารประกอบ
- **ระบบยืนยันตัวตน**: ลงทะเบียนและเข้าสู่ระบบอย่างปลอดภัย
- **การติดตามสถานะ**: ตรวจสอบสถานะการขอแก้ไขเกรด
- **Responsive Design**: ใช้งานได้บนทุกอุปกรณ์

## 🏗️ สถาปัตยกรรม

โปรเจกต์นี้ใช้ **Clean Architecture** เพื่อแยกชั้นการทำงานอย่างชัดเจน:

```
src/
├── entities/           # โมเดลข้อมูลหลัก
├── usecases/          # กฎทางธุรกิจและ Use Cases
├── adapters/          # ตัวเชื่อมต่อระหว่างชั้น
│   ├── controllers/   # React Hooks และการจัดการ State
│   └── gateways/      # การเชื่อมต่อ API
├── frameworks/        # เฟรมเวิร์กและไลบรารีภายนอก
│   ├── web/          # React Components
│   ├── api/          # HTTP Client
│   └── storage/      # การจัดเก็บข้อมูลในเครื่อง
└── shared/           # ยูทิลิตี้และค่าคงที่ที่ใช้ร่วมกัน
```

## 🚀 การติดตั้งและใช้งาน

### ข้อกำหนดระบบ

- Node.js 16.0.0 หรือสูงกว่า
- npm หรือ yarn

### การติดตั้ง

1. **Clone โปรเจกต์**
   ```bash
   git clone https://github.com/yourusername/student-grade-system.git
   cd student-grade-system
   ```

2. **ติดตั้ง Dependencies**
   ```bash
   npm install
   ```

3. **เริ่มต้นการพัฒนา**
   ```bash
   npm start
   ```

4. **เปิดเบราว์เซอร์**
   ```
   http://localhost:3000
   ```

## 📝 คำสั่งที่มีให้ใช้งาน

| คำสั่ง | คำอธิบาย |
|--------|----------|
| `npm start` | เริ่มต้น development server |
| `npm run build` | สร้าง production build |
| `npm test` | รันการทดสอบ |
| `npm run lint` | ตรวจสอบ code style |
| `npm run lint:fix` | แก้ไข code style อัตโนมัติ |
| `npm run format` | จัดรูปแบบโค้ดด้วย Prettier |
| `npm run format:check` | ตรวจสอบรูปแบบโค้ด |

## 🧪 การทดสอบ

โปรเจกต์มีการทดสอบครอบคลุมทุกชั้น:

- **Unit Tests**: ทดสอบ Components, Hooks และ Utilities
- **Integration Tests**: ทดสอบการทำงานร่วมกันของ Components
- **API Tests**: ทดสอบการเชื่อมต่อ API

```bash
# รันการทดสอบทั้งหมด
npm test

# รันการทดสอบแบบ watch mode
npm test -- --watch

# ดูรายงาน coverage
npm test -- --coverage
```

## 📱 หน้าจอหลัก

### 1. หน้าเข้าสู่ระบบ (`/login`)
- ฟอร์มเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน
- การตรวจสอบความถูกต้องของข้อมูล
- ลิงก์ไปยังหน้าลงทะเบียน

### 2. หน้าลงทะเบียน (`/register`)
- ฟอร์มลงทะเบียนสำหรับนักเรียนใหม่
- การตรวจสอบรูปแบบข้อมูล
- การยืนยันรหัสผ่าน

### 3. หน้าแดชบอร์ด (`/dashboard`)
- ภาพรวมข้อมูลนักเรียน
- สถิติเกรดและผลการเรียน
- ลิงก์ด่วนไปยังฟีเจอร์ต่างๆ

### 4. หน้าเกรด (`/grades`)
- รายการเกรดทั้งหมดแยกตามรายวิชา
- ฟิลเตอร์ตามเทอมและปีการศึกษา
- ปุ่มขอแก้ไขเกรดสำหรับแต่ละรายวิชา

### 5. หน้าการขอแก้ไข (`/corrections`)
- รายการคำขอแก้ไขเกรดทั้งหมด
- สถานะการพิจารณา (รอดำเนินการ/อนุมัติ/ปฏิเสธ)
- ประวัติการขอแก้ไข

## 🔧 เทคโนโลยีที่ใช้

### Frontend
- **React 19.1.1** - UI Library
- **TypeScript 4.9.5** - Type Safety
- **React Router 6.26.2** - Routing
- **CSS3** - Styling
- **Jest & React Testing Library** - Testing

### Development Tools
- **ESLint** - Code Linting
- **Prettier** - Code Formatting
- **Husky** - Git Hooks (ถ้ามี)

## 🎨 Design System

โปรเจกต์ใช้ Design System ที่สอดคล้องกัน:

- **สี**: ใช้ CSS Custom Properties สำหรับ Color Palette
- **Typography**: ระบบ Font และ Font Size ที่สม่ำเสมอ
- **Spacing**: ระบบ Margin และ Padding แบบ 8px Grid
- **Components**: UI Components ที่ใช้ซ้ำได้

## 📁 โครงสร้างไฟล์สำคัญ

```
src/
├── entities/
│   ├── Student.ts              # โมเดลข้อมูลนักเรียน
│   ├── Grade.ts                # โมเดลข้อมูลเกรด
│   └── GradeCorrection.ts      # โมเดลข้อมูลการขอแก้ไข
├── usecases/
│   ├── AuthUseCase.ts          # Use Case สำหรับการยืนยันตัวตน
│   └── GradeUseCase.ts         # Use Case สำหรับการจัดการเกรด
├── frameworks/web/
│   ├── components/             # React Components
│   ├── contexts/               # React Contexts
│   ├── hooks/                  # Custom Hooks
│   └── pages/                  # Page Components
└── styles/
    ├── design-system.css       # Design System Variables
    └── responsive-utilities.css # Responsive Utilities
```

## 🔒 ความปลอดภัย

- **JWT Authentication**: ระบบยืนยันตัวตนด้วย JSON Web Tokens
- **Input Validation**: ตรวจสอบข้อมูลนำเข้าทั้งฝั่ง Client และ Server
- **XSS Protection**: ป้องกันการโจมตี Cross-Site Scripting
- **Secure Storage**: จัดเก็บ Token อย่างปลอดภัย

## 🤝 การมีส่วนร่วม

1. Fork โปรเจกต์
2. สร้าง Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit การเปลี่ยนแปลง (`git commit -m 'Add some AmazingFeature'`)
4. Push ไปยัง Branch (`git push origin feature/AmazingFeature`)
5. เปิด Pull Request

## 📄 License

โปรเจกต์นี้อยู่ภายใต้ MIT License - ดูรายละเอียดในไฟล์ [LICENSE](LICENSE)

## 📞 ติดต่อ

- **ผู้พัฒนา**: [ชื่อของคุณ]
- **อีเมล**: [อีเมลของคุณ]
- **GitHub**: [https://github.com/yourusername](https://github.com/yourusername)

## 🙏 กิตติกรรมประกาศ

ขอบคุณทุกคนที่มีส่วนร่วมในการพัฒนาโปรเจกต์นี้

---

**หมายเหตุ**: โปรเจกต์นี้พัฒนาขึ้นเพื่อการศึกษาและสาธิต Clean Architecture ใน React Application