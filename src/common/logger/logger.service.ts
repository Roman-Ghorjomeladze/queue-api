import { Injectable, Scope } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable({ scope: Scope.REQUEST })
export class AppLogger {
  private traceId: string;

  constructor() {
    this.traceId = randomUUID();
  }

  setTraceId(id: string) {
    this.traceId = id;
  }

  private getContext(): string | null {
    const stack = new Error().stack;
    if (!stack) return null;

    const lines = stack.split('\n').map((l) => l.trim());

    const callerLine = lines.find(
      (line) =>
        !line.includes('AppLogger.') && // skip AppLogger methods
        !line.includes('LoggerInterceptor') && // skip interceptor
        !line.includes('node_modules'), // skip node internals
    );

    if (!callerLine) {
      return null;
    }

    const match = callerLine.match(/at (.*) \(/);
    return match ? match[1] : null;
  }

  private format(message: string, meta?: any) {
    const context = this.getContext();
    const ctxString = context ? `[${context}]` : '';
    const base = `[traceId=${this.traceId}] ${ctxString} ${message}`;

    if (!meta) return base;

    const metaString =
      typeof meta === 'object' ? JSON.stringify(meta, null, 2) : String(meta);

    return `${base}\n${metaString}`;
  }

  log(message: string, meta?: unknown) {
    console.log(this.format(message, meta));
  }

  warn(message: string, meta?: unknown) {
    console.warn(this.format(message, meta));
  }

  error(message: string, meta?: unknown) {
    console.error(this.format(message, meta));
  }
}
