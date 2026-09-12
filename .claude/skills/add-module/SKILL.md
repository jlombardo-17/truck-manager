---
description: Scaffold a new NestJS backend module following truck-manager patterns
---

# Add Backend Module

Creates a complete NestJS module (entity, DTOs, service, controller, module file) and wires it into `app.module.ts`.

## Usage

```
/add-module <nombre>
```

Example: `/add-module incidente` → creates `backend/src/modules/incidentes/`

## Steps

### 1. Determine names

From the argument `<nombre>` (singular, Spanish, lowercase):
- **Module folder:** `<nombre>s` (plural) — e.g. `incidentes`
- **Class prefix:** PascalCase singular — e.g. `Incidente`
- **Controller route:** plural — e.g. `incidentes`
- **File prefix:** kebab-case — e.g. `incidente`

### 2. Create files

All files go in `backend/src/modules/<nombre>s/`.

#### `<nombre>.entity.ts`

```typescript
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: '<nombre>s' })
export class <Nombre> {
  @PrimaryGeneratedColumn()
  id: number;

  // TODO: agregar columnas del dominio

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### `dto/create-<nombre>.dto.ts`

```typescript
import { IsOptional, IsString } from 'class-validator';

export class Create<Nombre>Dto {
  // TODO: agregar campos con decoradores class-validator
  @IsString()
  descripcion: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
```

#### `dto/update-<nombre>.dto.ts`

```typescript
import { PartialType } from '@nestjs/mapped-types';
import { Create<Nombre>Dto } from './create-<nombre>.dto';

export class Update<Nombre>Dto extends PartialType(Create<Nombre>Dto) {}
```

#### `<nombre>s.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { <Nombre> } from './<nombre>.entity';
import { Create<Nombre>Dto } from './dto/create-<nombre>.dto';
import { Update<Nombre>Dto } from './dto/update-<nombre>.dto';

@Injectable()
export class <Nombre>sService {
  constructor(
    @InjectRepository(<Nombre>)
    private readonly repository: Repository<<Nombre>>,
  ) {}

  findAll(): Promise<<Nombre>[]> {
    return this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<<Nombre>> {
    const record = await this.repository.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException('<Nombre> no encontrado');
    }
    return record;
  }

  create(dto: Create<Nombre>Dto): Promise<<Nombre>> {
    const record = this.repository.create(dto);
    return this.repository.save(record);
  }

  async update(id: number, dto: Update<Nombre>Dto): Promise<<Nombre>> {
    const record = await this.findOne(id);
    Object.assign(record, dto);
    return this.repository.save(record);
  }

  async remove(id: number): Promise<{ message: string }> {
    const record = await this.findOne(id);
    await this.repository.remove(record);
    return { message: '<Nombre> eliminado correctamente' };
  }
}
```

#### `<nombre>s.controller.ts`

```typescript
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { <Nombre>sService } from './<nombre>s.service';
import { Create<Nombre>Dto } from './dto/create-<nombre>.dto';
import { Update<Nombre>Dto } from './dto/update-<nombre>.dto';

@UseGuards(JwtAuthGuard)
@Controller('<nombre>s')
export class <Nombre>sController {
  constructor(private readonly <nombre>sService: <Nombre>sService) {}

  @Get()
  findAll() {
    return this.<nombre>sService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.<nombre>sService.findOne(id);
  }

  @Post()
  create(@Body() dto: Create<Nombre>Dto) {
    return this.<nombre>sService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Update<Nombre>Dto) {
    return this.<nombre>sService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.<nombre>sService.remove(id);
  }
}
```

#### `<nombre>s.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { <Nombre> } from './<nombre>.entity';
import { <Nombre>sController } from './<nombre>s.controller';
import { <Nombre>sService } from './<nombre>s.service';

@Module({
  imports: [TypeOrmModule.forFeature([<Nombre>]), AuthModule],
  controllers: [<Nombre>sController],
  providers: [<Nombre>sService],
  exports: [<Nombre>sService],
})
export class <Nombre>sModule {}
```

### 3. Register in app.module.ts

Add import and add to the `imports` array in `backend/src/app.module.ts`:

```typescript
import { <Nombre>sModule } from './modules/<nombre>s/<nombre>s.module';
// ...
imports: [
  // ... existing modules
  <Nombre>sModule,
],
```

### 4. Verify

After the user restarts the backend (`npm run start:dev`), TypeORM auto-syncs the new table. Confirm with:

```bash
curl -s http://localhost:3000/<nombre>s -H "Authorization: Bearer <token>" | head -c 200
```

Expected: `[]` (empty array, no error).

## Notes

- `synchronize: true` in dev means the table is created automatically on restart — no migration needed.
- If the module needs a relation to `Camion`, `Chofer`, or `Viaje`, add `@ManyToOne` on the entity and import the parent module.
- All endpoints are protected with `JwtAuthGuard` — no public routes.
