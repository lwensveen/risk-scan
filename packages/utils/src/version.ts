export const VERSION =
  (process.env.npm_package_version as string | undefined) ?? '0.0.0-dev';

export const GIT_SHA = process.env.GIT_SHA ?? 'dev';
