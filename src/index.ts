import { PicGo } from 'picgo'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

export = (ctx: PicGo) => {
  const register = (): void => {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    const uploadOptions = (url: string, accessToken: string, image: any) => {
      return {
        method: 'POST',
        uri: url + '/api/upload',
        headers: {
          contentType: 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`
        },
        formData: {
          file: image
        }
      }
    }
    ctx.helper.uploader.register('imageflow', {
      config (ctx) {
        return [
          {
            name: 'url',
            type: 'input',
            required: true,
            message: '服务器 url',
            alias: '服务器地址'
          },
          {
            name: 'token',
            type: 'input',
            required: true,
            message: 'API Token',
            alias: 'API密钥'
          },
          {
            name: 'expiryMinutes',
            type: 'input',
            required: false,
            message: '过期时间（分钟）'
          },
          {
            name: 'tags',
            type: 'input',
            required: false,
            message: '标签（逗号分隔）'
          }
        ]
      },
      async handle2 (ctx) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const userConfig = ctx.getConfig('picBed.imageflow') as {
          url: string
          token: string
          expiryMinutes?: number
          tags?: string
        }

        const imgList = ctx.output
        for (const i in imgList) {
          let image = imgList[i].buffer
          if (!image && imgList[i].base64Image) {
            image = Buffer.from(imgList[i].base64Image, 'base64')
          }
          const data = new Uint8Array(image)
          const fileName = imgList[i].fileName
          const filePath = path.join(__dirname, fileName)
          await fs.writeFileSync(filePath, data)

          ctx.log.info(name + ' --> 开始上传图片: ' + fileName)

          // 文件上传
          const uploadConfig = uploadOptions(userConfig.url, userConfig.token, fs.createReadStream(filePath))
          var uploadBody
          try {
            uploadBody = await ctx.request(uploadConfig)
            uploadBody = JSON.parse(uploadBody)
          } catch (err) {
            // 如果token过期，则重新登陆获取token
            accessToken = await getTokenByLogin(ctx)
            ctx.saveConfig({ 'picBed.halo-uploader.accessToken': accessToken })
            uploadBody = await ctx.request(uploadOptions(haloUrl, accessToken, fs.createReadStream(filePath)))
            uploadBody = JSON.parse(uploadBody)
            // ctx.log.info("重新获取token成功：" + accessToken);
            // ctx.log.info(uploadBody);
          }
          if (uploadBody.status === 200) {
            fs.unlink(filePath, () => { })
            delete imgList[i].base64Image
            delete imgList[i].buffer
            imgList[i].imgUrl = uploadBody.data.path
            ctx.log.info(name + ' --> 图片上传成功；imgUrl: ' + imgList[i].imgUrl)
          } else {
            ctx.emit('notification', {
              title: '上传失败',
              body: uploadBody.message
            })
            throw new Error(uploadBody.message)
          }
        }
      },
      async handle (ctx) {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
        const userConfig = ctx.getConfig('picBed.imageflow') as {
          url: string
          token: string
          expiryMinutes?: number
          tags?: string
        }
        if (!userConfig) {
          throw new Error('Can\'t find uploader config')
        }

        const form = new FormData()
        // 添加图片文件
        ctx.output.forEach((file) => {
          if (file.buffer) {
            form.append('images[]', file.buffer, {
              filename: file.fileName,
              contentType: 'image/' + (file.extname?.replace('.', '') || 'png')
            })
          }
        })

        // 添加可选参数
        if (userConfig.expiryMinutes) {
          // form.append('expiryMinutes', userConfig.expiryMinutes)
        }
        if (userConfig.tags) {
          // form.append('tags', (String(userConfig.tags) || '').split(','))
        }
        try {
          // 发送请求并处理响应
          const response = await ctx.request({
            url: String(userConfig.url) + '/api/upload',
            method: 'POST',
            headers: {
              Authorization: `Bearer ${userConfig.token}`,
              ContentType: 'multipart/form-data'
            },
            form
          }) as unknown as {
            data: {
              success: boolean
              data?: { urls: string[] }
              message?: string
            }
          }

          // 处理响应数据
          if (response.data.success && response.data.data?.urls) {
            ctx.output = ctx.output.map((file, index) => ({
              ...file,
              url: response.data.data?.urls?.[index] ?? ''
            }))
          } else {
            throw new Error(response.data.message ?? '上传失败')
          }

          return ctx
        } catch (error) {
          ctx.emit('notification', {
            title: '上传失败',
            body: error instanceof Error ? error.message : String(error)
          })
          throw error
        }
      }
    })
  }

  return {
    uploader: 'imageflow',
    register
  }
}
