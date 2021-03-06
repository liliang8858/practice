const ReplyProxy = require('../../proxy/reply');
const TopicProxy = require('../../proxy/topic');
const NoticeProxy = require('../../proxy/notice');

class Reply {
  // 创建回复
  async createReply(ctx) {
    const { id } = ctx.state.user;
    const { tid } = ctx.params;

    const topic = await TopicProxy.getById(tid);

    if (!topic) {
      ctx.throw(404, '话题不存在');
    }

    const { content, reply_id } = ctx.request.body;

    if (!content) {
      ctx.throw(400, '回复内容不能为空');
    }

    const _reply = {
      content,
      author_id: id,
      topic_id: tid,
    };

    if (reply_id) {
      _reply.reply_id = reply_id;
    }

    // 创建回复
    const reply = await ReplyProxy.create(_reply);

    // 修改最后一次回复
    topic.reply_count += 1;
    topic.last_reply = id;
    await topic.save();

    // 发送提醒
    if (reply_id) {
      await NoticeProxy.create({
        type: 'at',
        author_id: id,
        target_id: topic.author_id,
        topic_id: topic.id,
        reply_id: reply.id
      });
    } else {
      await NoticeProxy.create({
        type: 'reply',
        author_id: id,
        target_id: topic.author_id,
        topic_id: topic.id
      });
    }

    ctx.body = '';
  }

  // 删除回复
  async deleteReply(ctx) {
    const { id } = ctx.state.user;
    const { rid } = ctx.params;

    const reply = await ReplyProxy.getById(rid);

    if (!reply) {
      ctx.throw(404, '回复不存在');
    }

    if (!reply.author_id.equals(id)) {
      ctx.throw(403, '不能删除别人的回复');
    }

    // 修改话题回复数
    const topic = await TopicProxy.getById(reply.topic_id);

    topic.reply_count -= 1;
    await topic.save();

    // 删除回复
    await ReplyProxy.deleteById(rid);

    ctx.body = '';
  }

  // 编辑回复
  async updateReply(ctx) {
    const { id } = ctx.state.user;
    const { rid } = ctx.params;

    const reply = await ReplyProxy.getById(rid);

    if (!reply) {
      ctx.throw(404, '回复不存在');
    }

    if (!reply.author_id.equals(id)) {
      ctx.throw(403, '不能编辑别人的评论');
    }

    const { content } = ctx.request.body;

    if (!content) {
      ctx.throw(400, '回复内容不能为空');
    }

    reply.content = content;
    await reply.save();

    ctx.body = '';
  }

  // 回复点赞或者取消点赞
  async upOrDownReply(ctx) {
    const { id } = ctx.state.user;
    const { rid } = ctx.params;

    const reply = await ReplyProxy.getById(rid);

    if (!reply) {
      ctx.throw(404, '回复不存在');
    }

    if (reply.author_id.equals(id)) {
      ctx.throw(403, '不能给自己点赞哟');
    }

    let action;

    const upIndex = reply.ups.indexOf(id);

    if (upIndex === -1) {
      reply.ups.push(id);
      action = 'up';
      // 发送提醒
      await NoticeProxy.create({
        type: 'up',
        author_id: id,
        target_id: reply.author_id,
        reply_id: reply.id
      });
    } else {
      reply.ups.splice(upIndex, 1);
      action = 'down';
    }

    await reply.save();

    ctx.body = action;
  }
}

module.exports = new Reply();
