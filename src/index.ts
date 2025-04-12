import { PicGo } from 'picgo'
import fs from 'fs'
import path from 'path'
import util from 'util'

export = (ctx: PicGo) => {
  const register = (): void => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const uploadOptions = (url: string, accessToken: string, image: any) => {
      return {
        method: 'POST' as 'POST',
        url: url + '/api/upload',
        headers: {
          contentType: 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`
        },
        formData: {
          'images[]': image
        },
        timeout: 0,
        resolveWithFullResponse: true
      }
    }
    ctx.helper.uploader.register('imageflow', {
      config (ctx) {
        return [
          {
            name: 'url',
            type: 'input',
            required: true,
            message: '服务器地址',
            alias: 'URL'
          },
          {
            name: 'token',
            type: 'input',
            required: true,
            message: 'API Token',
            alias: 'API Key'
          }
          // {
          //   name: 'expiryMinutes',
          //   type: 'input',
          //   required: false,
          //   message: '过期时间（分钟）'
          // },
          // {
          //   name: 'tags',
          //   type: 'input',
          //   required: false,
          //   message: '标签（逗号分隔）'
          // }
        ]
      },
      async handle (ctx) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const userConfig = ctx.getConfig('picBed.imageflow') as {
          url: string
          token: string
          expiryMinutes?: number
          tags?: string
        }

        const imgList = ctx.output
        for (const img of imgList) {
          const image = img.buffer
          // if (!image && img.base64Image) {
          //   image = Buffer.from(img.base64Image, 'base64')
          // }
          if (!image) {
            throw new Error('Image buffer is undefined')
          }
          const data = new Uint8Array(image)
          const fileName: string = img.fileName || 'default-file-name'
          const filePath = path.join(__dirname, fileName)
          let url = userConfig.url
          if (url.endsWith('/')) {
            url = url.slice(0, -1)
          }
          await fs.writeFileSync(filePath, data)

          ctx.log.info(fileName + ' --> 开始上传图片')

          // 文件上传
          const uploadConfig = uploadOptions(url, userConfig.token, fs.createReadStream(filePath))
          let response
          try {
            response = await ctx.request(uploadConfig) as unknown as {
              status: number
              data: {
                results: [
                  {
                    filename: string
                    status: string
                    message: string
                    orientation: string
                    format: string
                    urls: {
                      auto: string
                      avif: string
                      original: string
                      webp: string
                    }
                  }
                ]
              }
            }
            // ctx.log.info('response: ' + util.inspect(response))
            const result = response.data.results[0]
            if (response.status === 200) {
              fs.unlink(filePath, () => { })
              delete img.base64Image
              delete img.buffer
              img.imgUrl = url + result.urls.original
              // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
              ctx.log.info(fileName + ' --> 图片上传成功；imgUrl: ' + img.imgUrl)
            } else {
              throw new Error(result.message)
            }
          } catch (error) {
            // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
            ctx.log.error(fileName + ' --> 上传失败: ' + error)
            ctx.emit('notification', {
              title: '上传失败',
              body: error instanceof Error ? error.message : String(error)
            })
            throw error
          }
        }
        return ctx
      }
    })
  }

  return {
    uploader: 'imageflow',
    register
  }
}
