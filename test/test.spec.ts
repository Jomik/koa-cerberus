import "mocha";
import Cerberus from "../src";
import * as chai from "chai";
import * as sinon from "sinon";
import * as sc from "sinon-chai";
import * as request from "supertest";
import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as Router from "koa-router";
import { Server } from "http";
import { expect } from "chai";
import { object, is } from "cerberus";
// tslint:disable:no-unused-expression

chai.use(sc);

describe("default", () => {
  let log: sinon.SinonStub;
  let sandbox: sinon.SinonSandbox;
  let server: Server;
  before(() => {
    const app = new Koa();
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (e) {
        ctx.status = 500;
      }
    });
    app.use(Cerberus());
    app.use(bodyParser());
    const router = new Router();
    router
      .post("/", (ctx) => {
        const schema = object({ body: object({ valid: is(true) }) });
        const { body } = schema.test(ctx.request);
      })
      .post("/401", (ctx) => {
        const schema = object({ body: object({ valid: is(true) }) });
        ctx.status = 401;
        const { body } = schema.test(ctx.request);
      })
      .get("/error", () => {
        throw new Error("foo");
      });
    app.use(router.routes());
    server = app.listen();
  });
  after(() => {
    server.close();
  });

  beforeEach(() => {
    log = sinon.stub(console, "log");
  });

  afterEach(() => {
    log.restore();
  });

  it("does not log succesful", (done) => {
    request(server)
      .post("/")
      .send({ valid: true })
      .expect(200, () => {
        expect(log).to.not.have.been.called;
        done();
      });
  });

  it("logs errors", (done) => {
    request(server)
      .post("/")
      .expect(400, () => {
        expect(log).to.have.been.calledOnce;
        done();
      });
  });

  it("does not modify non-200 status code", (done) => {
    request(server)
      .post("/401")
      .expect(401, () => {
        expect(log).to.have.been.calledOnce;
        done();
      });
  });

  it("does not catch other errors", (done) => {
    request(server)
      .get("/error")
      .expect(500, () => {
        done();
      });
  });
});
