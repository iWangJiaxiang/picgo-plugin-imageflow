import { PicGo } from 'picgo'

export = (ctx: PicGo) => {
  const register = (): void => {
    ctx.helper.uploader.register('imageflow', {
      handle (ctx) {
        console.log(ctx)
      }
    })
    ctx.helper.transformer.register('imageflow', {
      handle (ctx) {
        console.log(ctx)
      }
    })
    ctx.helper.beforeTransformPlugins.register('imageflow', {
      handle (ctx) {
        console.log(ctx)
      }
    })
    ctx.helper.beforeUploadPlugins.register('imageflow', {
      handle (ctx) {
        console.log(ctx)
      }
    })
    ctx.helper.afterUploadPlugins.register('imageflow', {
      handle (ctx) {
        console.log(ctx)
      }
    })
  }
  return {
    uploader: 'imageflow',
    transformer: 'imageflow',
    register
  }
}
