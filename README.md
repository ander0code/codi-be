# Node.js + Express + TypeScript Template

Modern production-ready template with development best practices.

## ✨ Stack

- **Node.js** + **Express** + **TypeScript** with ESModules
- **Prisma ORM** with PostgreSQL and integrated Zod types
- **Swagger/OpenAPI** for automatic documentation
- **Pino** for structured logging with rotation
- **Zod** for schema and environment variables validation
- **Docker** + **Nginx** for deployment

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm/npm
- PostgreSQL

### Installation

```bash
git clone https://github.com/juniorodrigo/node-ts.git
cd node-ts
pnpm install
```

### Configuration

1. **Environment variables:**

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/database"
ALLOWED_ORIGINS=http://localhost:3000
```

2. **Database:**

```bash
pnpm run prisma:generate
pnpm run prisma:migrate
```

3. **Development:**

```bash
pnpm run dev
```

> Server available at `http://localhost:3000`  
> API Documentation at `http://localhost:3000/api-docs`

## 📜 Scripts

| Command             | Description                 |
| ------------------- | --------------------------- |
| `pnpm run dev`      | Development with hot reload |
| `pnpm run build`    | Compile TypeScript          |
| `pnpm run start`    | Production                  |
| `pnpm run test`     | Run tests                   |
| `pnpm run lint`     | Linting                     |
| `pnpm run prisma:*` | Prisma commands             |

## 📁 Structure

```
src/
├── config/          # Configuration (env, logger, swagger)
├── lib/             # Clients and utilities (Prisma, Zod)
├── middlewares/     # Custom middlewares
├── modules/         # Business modules
│   └── test/        # Example: controller, service, schemas, router
├── spec/            # OpenAPI documentation
├── types/           # TypeScript types
├── utils/           # General utilities
├── index.ts         # Entry point
└── routes.ts        # Main routes configuration
```

## 🏗️ Module Architecture

Each module follows the pattern:

```
modules/my-module/
├── controller.ts    # HTTP handling
├── service.ts       # Business logic
├── schemas.ts       # Zod validation
└── router.ts        # Route definitions
```

**Implementation example:**

```typescript
// schemas.ts
export const CreateUserSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
});

// controller.ts
export async function createUser(req: Request, res: Response) {
	const validation = customParse(CreateUserSchema, req.body);
	if (!validation.success) throw new ValidationError(validation.message);

	const result = await UserService.createUser(validation.data);
	res.success(result.data, result.message);
}
```

## 📝 Key Features

### Pino Logging

- Structured logs with daily rotation
- Level separation (error, combined)
- Custom methods: `logger.success()`, `logger.request()`, `logger.response()`
- See [docs/LOGGING.md](docs/LOGGING.md) for more details on logging.

### Security

- Rate limiting (100 req/15min)
- CORS configured
- Helmet for HTTP headers
- Smart compression

### Validation

- Zod schemas with friendly messages
- Automatic environment variables validation
- Auto-generated TypeScript types

## 🐳 Docker

```bash
# Build
docker build -f docker/Dockerfile -t my-app .

# Run
docker run -p 3000:3000 --env-file .env my-app
```

## 🤝 Contributing

See [CONTRIBUTE.md](./CONTRIBUTE.md) for development guidelines and commit standards.

## 📄 License

MIT License
