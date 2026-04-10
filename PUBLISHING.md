# Publishing `@fehmicorp/middleware`

## Prerequisites

- npm account with publish access to `@fehmicorp` scope
- Logged in locally:

```bash
npm login
```

## Release steps

1. Update package version:

```bash
npm version patch
```

2. Build and validate tarball:

```bash
npm run build
npm pack
```

3. Publish to npm:

```bash
npm publish --access public
```

## Verify package

```bash
npm view @fehmicorp/middleware version
```
