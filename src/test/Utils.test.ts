import "chai/register-should";
import _ from "lodash";
import produce from "immer";
import { clonePlain, filterCopy, findGetters } from "../Utils";
import { assert } from "chai";

test("clonePlain", () => {
  const src = {
    foo: "bar",
    n: 2,
    a: [1, 2, 3, () => 1],
    zoo: {
      get bar() {
        return 3;
      },
      zap: "zo",
    },
    zin: {
      get fum() {
        return 4;
      },
    },
  };
  const expected = {
    foo: "bar",
    n: 2,
    a: [1, 2, 3],
    zoo: {
      zap: "zo",
    },
    zin: {},
  };

  const copy = clonePlain(src);
  copy.should.deep.equal(expected);
  ("bar" in copy.zoo).should.equal(false);
});

function filterCopyData() {
  const src = {
    foo: "ignored",
    pickMeToo: "zip",
    bar: {
      baz: undefined,
      yo: {
        bah: undefined,
        pickMe: "zap",
      },
    },
  };
  const dest = {
    bar: {
    },
  };
  return {src, dest};
}

test("filterCopy", () => {
  const {src, dest} = filterCopyData();
  filterCopy(src, dest, (key:string) => key.startsWith("pick"));
  (dest as any).pickMeToo.should.equal("zip");
  (dest as any).bar.yo.pickMe.should.equal("zap");

});

test("immer filterCopy", () => {
  const {src, dest} = filterCopyData();

  const result = produce(dest, draft => {
    filterCopy(src, draft, (key:string) => key.startsWith("pick"));
  });

  (result as any).pickMeToo.should.equal("zip");
  (result as any).bar.yo.pickMe.should.equal("zap");
  assert((dest as any).pickMeToo === undefined);
});

test("findGetters", () => {
  const src = {
    get foo() {return 7},
    hoo: "hood",
    bar: {
      get gogo() {return 9;},
      boo: "bood"
    }
  }
  const getters = findGetters(src);
  const getterPaths = getters.map(path => path.join("."));//?
  getterPaths.includes("foo").should.be.true;
  getterPaths.includes("bar.gogo").should.be.true;
});