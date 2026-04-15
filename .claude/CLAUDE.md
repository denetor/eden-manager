
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
- Use 4 spaces as indentation
- Files must not contain more than one single class or interface
- Use English language for comments, and symbol names like variables, classes, methods, etc...

## File naming

- ALl files name are entirely lowercase, with a dash `-` to separate words
- File containing services must end in `.service.ts`
- File containing models must end in `.model.ts`
- File containing actors must end in `.actor.ts`
- File containing ECS components must end in `.component.ts`
- File containing ECS systems must end in `.system.ts`
- File containing scenes must end in `.scene.ts`

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

