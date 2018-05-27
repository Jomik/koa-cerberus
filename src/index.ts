import { ValidationError } from "cerberus";
import { Context } from "koa";

function defaultHandler(ctx: Context, error: ValidationError) {
  console.log(error.name, ctx.method, ctx.originalUrl, error.details());
}

export default (
  handler: (ctx: Context, error: ValidationError) => void = defaultHandler
) =>
  async function(ctx: Context, next: Function) {
    try {
      await next();
    } catch (e) {
      if (e instanceof ValidationError) {
        if (ctx.status === 200) {
          ctx.status = 400;
        }
        handler(ctx, e);
      } else {
        throw e;
      }
    }
  };
