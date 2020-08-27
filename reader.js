const constant = k => () => k;

// Identity monad: map and flatMap correspond to function application
class Id {
    constructor(value) {
        this.value = value;
    }
    flatMap(f) {
        return this.map(f);
    }
    map(f) {
        return f(this.value);
    }
    static of(value) {
        return new Id(value);
    }
}

// Right-biased Either monad
class Either {
    constructor(value) {
        this.value = value;
    }
    static left(e) {
        return new Left(e);
    }
    static right(v) {
        return new Right(v);
    }
    static of(v) {
        return new Right(v);
    }
}

// Represents computation failure
class Left extends Either {
    flatMap(f) {
        return this;
    }
}

// Represents computation success
class Right extends Either {
    flatMap(f) {
        return f(this.value);
    }
}

// Allows composition of monadic functions of shape a => M b
const Kleisli = M => class Kleisli {
    constructor(f) {
        this.f = f;
    }
    static of(v) {
        return new Kleisli(constant(M.of(v)));
    }
    static get ask() {
        return new Kleisli(M.of);
    }
    flatMap(fn) {
        return new Kleisli(e => this.run(e).flatMap( v => fn(v).run(e)));
    }
    map(fn) {
        return new Kleisli(e => this.run(e).map(fn));
    }
    run(env) {
        return this.f(env);
    }
};

const Reader = Kleisli(Id);
const ReaderT = Kleisli(Right);

const upper = str => Reader.ask.map(config => Either.right(config.upper ? str.toUpperCase() : str));
const flaky = str => Reader.ask.map(config => config.flaky ? Either.left('failed') : Either.right(str));
const duplicate = str => Reader.ask.map(config => Either.right(config.duplicate ? str + ':' + str : str));

const composed = ReaderT.of("hello").flatMap(upper).flatMap(flaky).flatMap(duplicate);

console.log(composed.run({ upper: true, duplicate: true, flaky: false}));
// Outputs: Right {value: "HELLO:HELLO"}

console.log(composed.run({ upper: true, duplicate: true, flaky: true}));
// Outputs: Left {value: "failed"}
