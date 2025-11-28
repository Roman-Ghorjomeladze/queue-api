<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Queue API built with NestJS that supports multiple queue providers: Memory (for development), RabbitMQ, and AWS SQS (via LocalStack for local development).

## Features

- ✅ Multiple queue provider support (Memory, RabbitMQ, AWS SQS)
- ✅ Docker setup with RabbitMQ and LocalStack (SQS)
- ✅ Switch between providers via environment variables
- ✅ Comprehensive unit tests
- ✅ Full JSDoc documentation

## Project setup

```bash
$ yarn install
```

## Docker Setup

This project includes Docker Compose configuration for local development with RabbitMQ and LocalStack (for SQS).

### Starting Docker Services

```bash
# Start RabbitMQ and LocalStack
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

- **RabbitMQ**: Available at `localhost:5672` (Management UI: http://localhost:15672)
  - Default credentials: `admin` / `admin`
- **LocalStack (SQS)**: Available at `http://localhost:4566`
  - Default credentials: `test` / `test`

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Key Configuration:**

1. **Queue Provider Selection:**
   ```env
   QUEUE_PROVIDER=memory  # Options: 'memory', 'sqs', 'rabbitmq'
   ```

2. **RabbitMQ Configuration:**
   ```env
   # For Docker (service name)
   RABBITMQ_HOST=rabbitmq
   RABBITMQ_PORT=5672
   RABBITMQ_USERNAME=admin
   RABBITMQ_PASSWORD=admin
   
   # Or use full URL
   # RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
   ```

3. **SQS Configuration (LocalStack):**
   ```env
   AWS_REGION=us-east-1
   AWS_ENDPOINT_URL=http://localhost:4566
   AWS_ACCESS_KEY_ID=test
   AWS_SECRET_ACCESS_KEY=test
   ```

### Using Different Queue Providers

**Memory Queue (default - no Docker required):**
```env
QUEUE_PROVIDER=memory
```

**RabbitMQ (requires Docker):**
```env
QUEUE_PROVIDER=rabbitmq
RABBITMQ_HOST=rabbitmq
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin
```

**SQS via LocalStack (requires Docker):**
```env
QUEUE_PROVIDER=sqs
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:4566
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
```

**SQS via Real AWS (production):**
```env
QUEUE_PROVIDER=sqs
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
# Leave AWS_ENDPOINT_URL unset or empty
```

### Creating SQS Queues in LocalStack

After starting LocalStack, create queues using AWS CLI:

```bash
# Create a queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name my-queue

# List queues
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

Or using curl:
```bash
# Create queue
curl -X POST http://localhost:4566/000000000000/my-queue

# List queues
curl http://localhost:4566/000000000000/
```

### Creating SQS Queues in LocalStack

After starting LocalStack, create queues using AWS CLI:

```bash
# Create a queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name my-queue

# List queues
aws --endpoint-url=http://localhost:4566 sqs list-queues
```

Or using curl:
```bash
curl -X POST http://localhost:4566/000000000000/my-queue
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
