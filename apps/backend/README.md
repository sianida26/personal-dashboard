# Back-end Documentation

## Getting Started

1. Install dependencies:

```sh
pnpm install
```

2. Set up environment variables:

Create a `.env` file in the root directory and add the necessary environment variables. Refer to `.env.example` for the required variables.

3. Build the project:

```sh
pnpm run build
```

4. Migrate the database:

```sh
pnpm db:migrate
```

5. Seed the database:

```sh
pnpm db:seed
```

6. Run the development server:

```sh
pnpm run dev
```

## Routing

Routes are defined in the [src/index.ts](src/index.ts) file. You can organize route groups in the [src/routes/](src/routes/) directory. For example, user routes can be defined directly in the [src/index.ts](src/index.ts) file, or in [src/routes/userRoutes.ts](src/routes/userRoutes.ts), or in [src/routes/users/userRoutes.ts](src/routes/users/userRoutes.ts).

### Example

To define a user route, you can add it directly in the [src/index.ts](src/index.ts) file:

```ts
// src/index.ts
app.get("/users", async (c) => {
    // Handle GET request
});
```

Or, you can create a separate file in the routes directory:

```ts
// src/routes/userRoutes.ts
import { Hono } from "hono";
import HonoEnv from "../types/HonoEnv";
const userRoutes = new Hono<HonoEnv>();

userRoutes.get("/", async (c) => {
  // Handle GET request
});

export default userRoutes;
```

And then import and use it in the [src/index.ts](src/index.ts) file:

```ts
// src/index.ts
import userRoutes from "./routes/userRoutes";
app.route("/users", userRoutes);
```

You can also organize routes in subdirectories:

```ts
// src/routes/users/userRoutes.ts
import { Hono } from "hono";
const userRoutes = new Hono();

userRoutes.get("/", async (c) => {
  // Handle GET request
});

export default userRoutes;
```

And then import and use it in the [src/index.ts](src/index.ts) file:

```ts
// src/index.ts
import userRoutes from "./routes/users/userRoutes";
app.route("/users", userRoutes);
```

More details can be seen in the [HonoJS documentation](https://hono.dev/docs/api/routing).
