# 项目进度日志

## 2025-01-24

### Font Awesome 版本更新

#### 问题描述
- 使用 content 属性显示 Font Awesome 图标失效
- 原因是 Font Awesome 版本从 5.15.4 升级到 6.5.1

#### 解决方案
1. 更新 CDN 链接：
```html
<!-- 旧版本 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">

<!-- 新版本 -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

2. CSS 中使用 content 属性时的区别：
```css
/* Font Awesome 5.x */
.icon:before {
    font-family: "Font Awesome 5 Free";
    font-weight: 900;
    content: '\f06e';
}

/* Font Awesome 6.x */
.icon:before {
    font-family: "Font Awesome 6 Free";
    font-weight: 900;
    content: '\f06e';
}
```

3. 使用类名方式（如 `fas fa-eye`）不受影响，两个版本通用

#### 注意事项
- 升级版本时需要检查所有使用 `content` 属性的图标
- 建议优先使用类名方式添加图标，避免版本依赖
- 记得更新所有页面的 Font Awesome CDN 链接

### 已实现的功能
- 分析了投票统计可视化系统的核心脚本（01-stellar-female-nomination.py）
- 了解了网站的整体结构和主要功能页面
- 完成了新星组冬季赛女子组可视化脚本的开发：
  - 主视图：03-nova-winter-female-nomination.py
  - 晋级视图：03-nova-winter-female-nomination-advance.py
  - 未晋级视图：03-nova-winter-female-nomination-eliminate.py
- 完成了角色头像数据的补充：
  - 创建了update_avatar_data.py脚本
  - 从characters-data.csv获取头像数据
  - 生成带头像的新Excel文件

### 遇到的错误
1. event-links.js 中的页面检查逻辑问题：
   - 使用 `mode: 'no-cors'` 导致无法获取真实响应状态
   - 导致显示了未创建的页面链接

2. 未晋级视图排名显示问题：
   - 最初使用了错误的排名计算方式
   - 改进为使用总排名，确保排名的连续性和准确性

### 解决方案
1. 修改 checkPageExists 函数：
   - 移除 `mode: 'no-cors'` 选项
   - 使用 `response.ok` 检查真实响应状态
   - 只有页面真实存在时才显示链接

2. 优化未晋级视图排名逻辑：
   - 先计算所有角色的总排名
   - 在未晋级视图中显示角色在总排名中的实际位置
   - 保持排名的连续性和公平性

### 待办事项
1. 创建其他赛事的可视化页面
2. 优化数据处理和可视化实现
3. 完善页面导航和交互功能
4. 将新的Excel文件转换为CSV格式

### 当前进度
1. 数据准备：
   - CSV文件已创建完成
   - 包含完整的角色信息
   - 包括CV信息和晋级状态
   - 新增角色头像数据

2. 可视化实现：
   - 完成主视图开发
   - 实现晋级视图
   - 实现未晋级视图
   - 优化页面导航

3. 代码优化：
   - 修复页面检查逻辑
   - 改进排名计算方式
   - 提高代码可维护性

### 表格功能优化
- 优化了表格排序功能
  - 移除了日期和赛事名称的排序（内容相同）
  - 添加了排序箭头指示器和呼吸动画
  - 优化了排序逻辑，分别处理已晋级和未晋级选手
  - 相同票数保持原有排名，相同排名按票数排序
  - 使用requestAnimationFrame确保视觉更新同步
  - 添加了轻量级的排序动画效果
- 优化了筛选功能
  - 选择"不筛选"时自动隐藏并清空搜索框
  - 动态更新搜索框和范围输入框的提示文本
  - 优化了动画效果，只在有实际筛选条件时执行
- 添加了日志追踪，方便调试和问题排查
- 添加了回到顶部功能
  - 滚动超过300px时显示按钮
  - 使用自定义动画实现平滑滚动
  - 添加了淡入淡出和悬浮效果
  - 使用requestAnimationFrame优化性能
  - 采用easeOutCubic缓动函数提升体验

## 已完成的功能

### 表格功能
- [x] 基础表格布局
- [x] 排序功能
- [x] 搜索筛选
- [x] 状态筛选
- [x] 动画效果
- [x] 下载功能
- [x] 响应式设计
- [x] 表格样式美化
- [x] 作品别名搜索
- [x] 声优提示框

### 数据可视化
- [x] 基础图表展示
- [x] 图表交互功能
- [x] 图表样式美化
- [x] 图表尺寸调整
- [x] 数据标签优化

## 待开发的功能

### 表格功能
- [ ] 更多筛选条件
- [ ] 数据导出优化
- [ ] 表格列宽调整

### 数据可视化
- [ ] 更多图表类型
- [ ] 数据对比功能
- [ ] 趋势分析

# 开发进度

## 已完成
- [x] 基础表格结构
- [x] 数据加载和渲染
- [x] 排序功能
- [x] 搜索和筛选
- [x] 本地存储
- [x] 导出功能
- [x] 动画效果
- [x] 统一男女表格的动画效果

## 待完成
- [ ] 移动端适配
- [ ] 性能优化
- [ ] 更多数据可视化
- [ ] 主题切换
- [ ] 国际化支持

# 新星组冬季赛提名表格

## 数据说明

本表格展示了新星组冬季赛的提名数据，包括：
- 排名
- 提名日期
- 赛事名称
- 角色头像
- 角色名称
- 作品名称
- 声优
- 得票数

## 功能特性

### 1. 搜索筛选
- 支持按角色名搜索
- 支持按作品名（含别名）搜索
- 支持按声优名搜索
- 支持按票数范围筛选
- 支持按排名范围筛选
- 多个关键词用空格或逗号分隔

### 2. 状态筛选
- 全部
- 自动晋级
- 普通提名
- 已晋级
- 未晋级

### 3. 排序功能
- 支持按排名排序
- 支持按角色名排序
- 支持按作品名排序
- 支持按声优排序
- 支持按得票数排序
- 自动保存排序状态

### 4. 导出功能
- 支持导出 CSV 格式
- 支持导出 JSON 格式
- 支持导出 Excel 格式
- 可导出当前筛选视图

### 5. 其他功能
- 回到顶部按钮
- 重置筛选按钮
- 平滑动画效果
- 响应式设计

## 数据来源
数据来自用户提名统计，每日更新。

## 技术实现
- 使用原生 JavaScript 实现
- 使用 ExcelJS 处理 Excel 文件
- 使用 CSS 实现动画效果
- 使用 LocalStorage 保存用户设置

## 更新记录
- 2025-01-25：创建表格
- 2025-01-25：添加搜索和筛选功能
- 2025-01-25：添加导出功能
- 2025-01-25：优化动画效果

## 新星组表格排序问题

### 问题描述
1. 每次刷新页面后，表格的排序状态都会重置
2. 原因是每次加载数据时都在强制设置 localStorage 的值

### 解决方案
1. 只在第一次访问时（即 localStorage 中没有排序状态时）设置默认值
2. 修改代码如下：
```javascript
// 保存默认排序状态
if (!localStorage.getItem('tableSortColumn')) {
    localStorage.setItem('tableSortColumn', '0');  // 排名列
    localStorage.setItem('tableSortDirection', 'asc');  // 初始状态设为升序
}
```

### 验证方法
1. 打开新星组表格页面
2. 点击排名列改变排序
3. 刷新页面，确认排序状态保持不变

### 注意事项
1. 默认排序是先按晋级状态再按票数排序
2. 排名列的箭头方向要和实际排序方向一致
3. 重置按钮会清除所有排序状态

### 排名排序问题修复

问题：
1. 点击排名表头需要点击两次才能切换排序状态
2. 排序方向与显示状态不一致
3. 晋级状态的排序与升序/降序不匹配
4. 排名排序时不应该改变排名数字，而应该按票数排序
5. 分组排序的实现方式有误
6. 晋级组的票数排序方向不正确
7. CSV 数据列索引错误
8. 排名列不应该可排序

解决方案：
1. 修改排序状态判断逻辑：
```javascript
const isAsc = th.classList.contains('sort-desc');  // 如果当前是降序，就切换到升序
th.classList.add(isAsc ? 'sort-asc' : 'sort-desc');
```

2. 根据排序方向调整晋级状态排序：
```javascript
if (aAdvanced !== bAdvanced) {
    return isAsc ? (aAdvanced ? -1 : 1) : (aAdvanced ? 1 : -1);
}
```

3. 调整行的显示顺序：
```javascript
// 票数排序时不考虑晋级状态
const sortedRows = columnIndex === 7 ?
    [...rows].sort(sortFunction) :
    (isAsc ? 
        [...advancedRows.sort(sortFunction), ...normalRows.sort(sortFunction)] : 
        [...normalRows.sort(sortFunction), ...advancedRows.sort(sortFunction)]);
```

4. 修改排名排序逻辑：
```javascript
if (columnIndex === 0) {  // 排名排序
    // ... 晋级状态判断 ...
    if (aAdvanced) {
        return isAsc ? b.votes - a.votes : a.votes - b.votes;  // 根据升降序改变票数排序方向
    } else {
        if (isAsc) {
            return b.votes - a.votes;  // 升序时按票数降序
        } else {
            // 降序时按排名降序
            const aRank = parseInt(a.columns[0]);
            const bRank = parseInt(b.columns[0]);
            return bRank - aRank;
        }
    }
}
```

5. 修正 CSV 数据列索引：
```javascript
// 错误的列索引
return {
    columns: columns,
    votes: parseInt(columns[7]) || 0,  // 错误：票数在第8列
    isAdvanced: columns[8] === "True",  // 错误：晋级状态在第9列
    rank: parseInt(columns[0]) || 0
};

// 正确的列索引
return {
    columns: columns,
    votes: parseInt(columns[5]) || 0,  // 正确：得票数在第6列
    isAdvanced: columns[7] === "True",  // 正确：是否晋级在第8列
    rank: parseInt(columns[0]) || 0
};
```

6. 移除排名列的排序功能：
```javascript
// 绑定排序事件
const sortableColumns = [4, 5, 6, 7];  // 移除排名列的排序功能
document.querySelectorAll('th').forEach((th, index) => {
    if (sortableColumns.includes(index)) {
        th.dataset.sortable = "true";
        th.addEventListener('click', () => sortTable(index));
    }
});
```

效果：
1. 一次点击就能切换排序状态
2. 升序时：
   - 晋级的在前，按票数降序
   - 未晋级的在后，按票数降序
3. 降序时：
   - 未晋级的在前，按排名降序
   - 晋级的在后，按票数升序
4. 同状态下按排名正确排序
5. 按票数排序时不考虑晋级状态，纯粹按票数大小排序
6. 排名排序时保持排名数字不变，只改变显示顺序
7. 每个分组内部都能正确应用排序规则
8. 正确读取 CSV 数据中的票数和晋级状态
9. 排名列不再参与排序，避免混淆

# 进度

## 新星组冬季提名

### 女性提名

- [x] 数据收集
- [x] 数据整理
- [x] 数据可视化
- [x] 页面制作

### 男性提名

- [x] 数据收集
- [x] 数据整理
- [x] 数据转换 (Excel -> CSV)
- [x] 角色数据库更新
- [ ] 数据可视化
- [ ] 页面制作

## 数据库

### 角色数据库

- [x] 基础数据收集
- [x] 数据格式规范
- [x] 数据整理
- [x] 新星组冬季提名男性角色补充

### 作品数据库

- [ ] 基础数据收集
- [ ] 数据格式规范
- [ ] 数据整理

# 开发进度记录

## 2024-01-26
### 弹幕组件开发
1. 问题：模板文件过于冗余
   - 问题：为了一行HTML代码创建单独的animation-container.html文件
   - 解决：将弹幕容器的HTML直接在template-loader.js中生成

2. 问题：路径计算错误
   - 问题：主页和其他页面的路径计算不一致
   - 原因：主页在根目录，其他页面在子目录
   - 解决：添加辅助函数正确处理路径
     ```js
     function getModulePath(moduleName) {
         return `./${moduleName}.js`;
     }
     
     function getResourcePath(path) {
         return basePath + path;
     }
     ```

3. 问题：配置文件加载失败
   - 问题：路径拼接导致重复的js/common/
   - 原因：相对路径计算错误
   - 解决：使用相对于template-loader.js的路径

4. 问题：动态脚本路径问题
   - 问题：动态生成的脚本中import路径错误
   - 原因：路径相对于网页而不是相对于脚本
   - 解决：使用getResourcePath构建正确的路径

5. 最终实现
   - 配置文件(config.js)控制弹幕开关
   - 统一的路径处理
   - 动态生成弹幕容器
   - CSS控制动画效果
   - 支持不同类型的弹幕样式

6. 使用方法
   ```html
   <include src="../../templates/animation-container.html"></include>
   ```

# 弹幕系统优化记录

## 问题1: 弹幕闪现
### 现象
- 当一个弹幕到达终点时，其他弹幕会同时闪现
- 所有弹幕都往左偏移后继续动画
- 闪现后不会恢复原位

### 解决方案
- 放弃CSS动画，改用JS控制动画
- 使用requestAnimationFrame精确控制动画帧
- 通过transform属性移动弹幕
- 每个弹幕独立计算位置

### 技术细节
```javascript
// 使用deltaTime确保动画速度一致
update(deltaTime) {
    this.position -= this.speed * deltaTime;
    this.element.style.transform = `translateX(${this.position}px)`;
}
```

## 问题2: 弹幕遮挡页面元素
### 现象
- animation-container容器挡住了页面下方的点击元素
- 弹幕有时会被页面的某些元素遮挡（如搜索框z-index:100）

### 解决方案
- 容器设置pointer-events: none
- 弹幕元素设置pointer-events: auto
- 动态计算并设置合适的z-index值

### 技术细节
```javascript
setupZIndex() {
    // 扫描页面所有元素的z-index
    // 设置合适的层级关系
    // container < message < tip
}
```

## 改进点
1. 性能优化
   - 使用transform代替left/top
   - 减少DOM操作
   - 独立的弹幕对象管理

2. 代码结构优化
   - 分离弹幕类和生成器类
   - 清晰的生命周期管理
   - 更好的错误处理

3. 用户体验
   - 弹幕悬停暂停
   - 复制功能
   - 不同类型样式

## 待优化
1. 弹幕碰撞检测
2. 弹幕密度控制
3. 性能监控
4. 错误恢复机制

# 进度记录

## 2025-01-26
- [x] 修复了角色卡片布局问题
  - [x] 移除了transform: scale方案
  - [x] 准备改用具体宽度调整方案
  - [x] 为未来添加角色详情页做准备
- [x] 修复了搜索功能的问题
  - [x] 修复了轮次模式下搜索不到内容的问题
  - [x] 修复了轮次模式下回车切换标签页时卡片不显示的问题
  - [x] 修复了错误提示框消失时间过长的问题

## 待办事项
- [ ] 调整角色卡片具体宽度和间距
  - [ ] 修改卡片容器grid布局
  - [ ] 优化标题和卡片间距
  - [ ] 确保整体宽度在1280px内
- [ ] 添加角色卡片点击跳转功能
  - [ ] 创建角色详情页模板
  - [ ] 添加点击事件处理
  - [ ] 实现页面跳转逻辑

## 2025-01-26
- [x] 修复导航栏重复加载的问题
  - [x] 移除navbar.js中的loadNavbar功能
  - [x] 将setActiveNavLink功能整合到template-loader.js
  - [x] 优化template-loader.js的include处理逻辑
  - [x] 删除未使用的loadScript函数

## 2025-01-26
- [x] 添加弹幕设置功能
  - [x] 在导航栏添加弹幕设置按钮
  - [x] 实现弹幕生成间隔调节
  - [x] 实现弹幕滚动速度调节
  - [x] 实现弹幕轨道数量调节
  - [x] 优化弹幕设置样式

## 2025-01-27
- [x] 修复弹幕设置功能
  - [x] 开启弹幕功能配置（CONFIG.features.danmaku）
  - [x] 规范化弹幕设置ID命名（使用danmaku前缀）
  - [x] 实现滑块和数字输入框的同步
  - [x] 优化输入框样式
    - [x] 移除默认聚焦轮廓
    - [x] 自定义聚焦时的边框和背景色
    - [x] 移除数字输入框的上下箭头
    - [x] 数值在输入框内居中显示

### 弹幕系统问题修复
1. 功能问题
   - `this.addDanmaku is not a function`：删除了方法但仍在调用，修改`startSending`直接使用JSON数据
   - 滑块值变化未应用：添加值变化监听，实时更新生成器设置

2. 界面优化
   - 弹幕设置改为模态框：更直观的交互方式，添加动画效果
   - 生成间隔单位：1分钟以下显示秒，1分钟及以上显示分钟，支持键盘调节
   - 设置项间距：统一20px内边距，首项15px，移除标题底距

3. 代码优化
   - 避免重复样式定义
   - 添加标准`appearance`属性提高兼容性
   - 优化动画性能和交互体验

## 弹幕系统优化
   
   - 将弹幕速度设置从硬编码改为配置项
   - 添加了屏幕宽度和滚动速度的实时显示
   - 重构了速度显示代码，减少重复
   - 将魔法数字（如500px缓冲距离）移至配置文件
   - 优化了弹幕速度的计算和显示逻辑
   - 修复了重复发送欢迎弹幕的问题

### 问题
1. 弹幕开关状态在刷新页面后没有正确恢复
2. 欢迎弹幕和第一条普通弹幕同时发送
3. 生成间隔设置在刷新页面后没有保持
4. 滑块和输入框的值没有正确同步

### 解决方案
1. 修复了`danmaku-generator.js`中的设置保存和恢复逻辑
2. 使用用户设置的生成间隔来延迟发送第一条普通弹幕
3. 确保在`syncInputs`函数中正确处理不同类型的设置项
4. 优化了设置UI的更新机制

### 经验总结
1. 在处理用户设置时，要确保所有相关组件都能正确响应设置的变化
2. 使用localStorage保存设置时，要注意初始化顺序和默认值的处理
3. 在添加新功能时要考虑与现有功能的交互
4. 保持代码整洁，及时清理调试日志

## 2025-01-28

### 弹幕系统优化

#### 问题描述
1. 弹幕轨道状态没有正确更新，导致所有弹幕都在同一轨道
2. 弹幕容器高度不足，导致第三个轨道的弹幕显示不完整
3. 弹幕位置需要调整，顶部弹幕需要在导航栏下方显示

#### 解决方案
1. 修复了弹幕轨道的占用和释放逻辑
2. 调整了弹幕容器高度，考虑padding和border的空间
3. 优化了弹幕位置：
  - 顶部弹幕位于导航栏下方(80px)
  - 中间弹幕垂直居中
  - 底部弹幕紧贴视口底部

#### 经验总结
1. 在设置元素高度时要考虑内边距和边框的影响
2. 使用CSS的calc()函数可以使计算更直观
3. 注意fixed定位元素与其他页面元素的层叠关系
4. localStorage存储使用情况分析：
  - 总存储大小：0.79 KB
  - 弹幕设置占用：0.14 KB
  - 欢迎状态占用：0.0078 KB
  - 当前使用量远低于浏览器限制（5-10MB）

### 弹幕功能开关优化

#### 问题描述
1. 弹幕功能通过CONFIG.features.danmaku全局控制
2. 功能关闭时仍显示弹幕设置按钮
3. 需要决定是隐藏还是移除弹幕相关元素

#### 解决方案
1. 在template-loader.js中处理导航栏时检查功能开关
2. 选择remove()方式完全移除弹幕设置元素：
  - 减少内存占用
  - 避免事件监听残留
  - 保持DOM结构清晰
3. 移除多余的loadNavbar函数，优化代码结构

#### 经验总结
1. 功能开关应该控制所有相关元素的加载
2. 选择remove()还是display:none要考虑：
  - 功能切换的频率
  - 内存和性能影响
  - 事件监听的处理
  - 代码的可维护性
3. 避免重复的DOM操作和函数调用

### 赛程页面优化

#### 功能改进
1. 搜索功能增强
  - 支持模糊搜索角色名
  - 显示多个匹配结果
  - 搜索结果添加角色头像

#### 数据结构优化
1. 简化比赛标题
  - 统一使用"恒星组提名"格式
  - 移除多余的性别标识
2. 精简数据字段
  - 只保留必要信息（name、ip、avatar）
  - 移除冗余字段（status、cv）

#### 界面美化
1. 角色选择列表
  - 调整头像尺寸为50px
  - 优化布局和间距
  - 改进文字提示

#### 开发经验
1. 数据处理自动化
  - 使用Python脚本处理数据转换
  - 避免手动编辑大量JSON数据
2. 用户体验思考
  - 简化信息展示
  - 相信用户基本判断能力
  - 保持界面简洁直观

## 2025-01-29

### 更新新星组票数数据

#### 计划任务
1. 创建update_nova_votes.py脚本
2. 读取两个组别的票数数据：
   - 03-nova-winter-female-nomination.json
   - 04-nova-winter-male-nomination.json
3. 更新nomination-stats-updated.json中的票数
4. 将恒星组的votes字段转换为数字类型

#### 实现步骤
1. 创建新脚本并设置文件路径
2. 读取源数据文件和目标文件
3. 分别处理男女两组的票数数据
4. 更新目标文件中的票数
5. 转换恒星组的票数格式

### 新星组票数数据更新

#### 问题描述
1. nomination-stats.json中的票数数据需要更新
2. 恒星组的votes字段需要转换为数字类型
3. 新星组男女两个组别的票数需要同时更新

#### 解决方案
1. 创建update_nova_votes.py脚本：
  - 读取03-nova-winter-female-nomination.json和04-nova-winter-male-nomination.json
  - 更新nomination-stats-updated.json中的票数数据
  - 将恒星组的votes字段转换为数字类型

#### 数据使用情况分析
1. votes字段的使用场景：
  - ip-distribution.js中用于显示角色详情弹窗的提名得票数
  - 用于区分自动晋级和正常晋级角色
  - 用于按得票数对角色进行排序

#### 经验总结
1. 数据类型的一致性很重要：
  - 将字符串类型的票数转换为数字类型
  - 保持"-"作为自动晋级的标识
2. 男女组数据要同时处理，避免遗漏
3. 在修改数据前要先确认数据的使用场景

#### 待办事项
1. 考虑在nomination-stats.js中添加票数分布的图表
2. 完善其他统计数据的可视化
3. 继续优化数据处理流程

### 新星组春季赛数据生成

#### 当前进度
1. 完成数据转换脚本：
  - 创建txt_to_excel_nova_spring_female.py
  - 从txt文件读取投票数据和英文名称
  - 更新Excel文件的相关字段：
    * 排名
    * 角色
    * IP
    * 得票数
    * 角色（英）
  - 按排名升序排序
  - 生成新的Excel文件避免覆盖原文件

#### 遇到的问题
1. 文件名格式不一致：
  - female-en.txt vs female_en.txt
  - 修正为使用下划线的命名方式
2. 列名不匹配：
  - txt文件中是"作品"
  - Excel中是"IP"
  - 统一使用"IP"作为列名
3. 排序方式：
  - 最初按得票数排序
  - 修正为按原有排名排序

#### 计划任务
1. 创建春季赛相关文件：
   - 05-nova-spring-female-nomination.json
   - 06-nova-spring-male-nomination.json
2. 更新数据处理脚本：
   - txt_to_excel_nova_spring_female.py
   - txt_to_excel_nova_spring_male.py
3. 生成可视化文件：
   - 05-nova-spring-female-nomination.py
   - 05-nova-spring-female-nomination-advance.py
   - 05-nova-spring-female-nomination-eliminate.py
   - 06-nova-spring-male-nomination.py
   - 06-nova-spring-male-nomination-advance.py
   - 06-nova-spring-male-nomination-eliminate.py

#### 文件结构
```
data/nomination/nova/spring/
├── female/
│   ├── female.txt          # 原始投票数据
│   ├── female-en.txt       # 英文名称数据
│   └── 05-nova-spring-female-nomination.json
└── male/
    ├── male.txt           # 原始投票数据
    ├── male-en.txt        # 英文名称数据
    └── 06-nova-spring-male-nomination.json
```

#### 实现步骤
1. 创建相关目录结构
2. 准备原始txt数据文件
3. 编写数据转换脚本
4. 生成JSON数据文件
5. 创建可视化脚本
6. 更新nomination-stats.json

## 2024-01-29

### 表格功能优化

#### 问题描述
1. 重置按钮点击后表头排序箭头状态未清除
2. 表格默认排序逻辑需要调整
3. 重置按钮悬停样式需要根据主题调整

#### 解决方案
1. 重置功能优化
   - 在重置按钮点击时清除表头排序状态
   - 清除localStorage中的排序记录
   - 确保重新加载数据时不会恢复排序状态

2. 排序逻辑调整
   - 恒星组默认按票数降序排序
   - 新星组保持CSV文件中的排名顺序
   - 排名列不参与排序功能

3. 样式优化
   - 冬季主题：重置按钮悬停时字体颜色改为深蓝色(#4a90e2)
   - 春季主题：重置按钮悬停时字体颜色改为亮粉色(#ff69b4)
   - 保持主题风格的一致性

#### 涉及文件
- js/table/01-stellar-female-nomination-table.js
- js/table/03-nova-winter-female-nomination-table.js
- js/table/05-nova-spring-female-nomination-table.js
- css/tables/02-nova-winter-nomination-table.css
- css/tables/03-nova-spring-nomination-table.css

#### 实现要点
1. 重置功能
```javascript
// 清除localStorage
localStorage.removeItem('tableSortColumn');
localStorage.removeItem('tableSortDirection');

// 清除表头排序状态
document.querySelectorAll('th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
});
```

2. 样式修改
```css
.reset-btn:hover {
    color: #4a90e2;  /* 冬季主题 */
    /* 或 */
    color: #ff69b4;  /* 春季主题 */
}
```

### 新星组春季赛男性组别数据可视化

#### 完成功能
1. 创建表格页面
   - 新建06-nova-spring-male-nomination-table.html
   - 新建06-nova-spring-male-nomination-table.js
   - 实现数据展示、排序、筛选功能

2. 创建可视化页面
   - 新建06-nova-spring-male-nomination.py（主视图）
   - 新建06-nova-spring-male-nomination-advance.py（晋级视图）
   - 新建06-nova-spring-male-nomination-eliminate.py（未晋级视图）

3. 数据处理
   - 新建csv_to_json_nova_spring_male.py
   - 实现CSV到JSON的数据转换
   - 保持与女性组别相同的数据结构

#### 实现要点
1. 表格功能
   - 保持与女性组别相同的筛选和排序逻辑
   - 使用春季主题样式
   - 添加投票统计数据显示

2. 可视化功能
   - 使用横向柱状图展示投票数据
   - 区分晋级和未晋级选手
   - 添加交互式图例
   - 支持图表尺寸调整

#### 涉及文件
- pages/tables/06-nova-spring-male-nomination-table.html
- js/table/06-nova-spring-male-nomination-table.js
- scripts/visualization/06-nova-spring-male-nomination.py
- scripts/visualization/06-nova-spring-male-nomination-advance.py
- scripts/visualization/06-nova-spring-male-nomination-eliminate.py
- scripts/data_processing/csv_to_json_nova_spring_male.py

## 2024/1/30

1. 更新了角色ID格式：
   - 冬季赛：NFW001/ENFW001（女性）、NMW001/ENMW001（男性）
   - 春季赛：NFSP001/ENFSP001（女性）、NMSP001/ENMSP001（男性）

2. 更新了比赛记录：
   - 修改了状态文本，移除"新星组"前缀
   - 保留了恒星组原有数据
   - 更新了新星组冬季赛和春季赛的记录
   - 为参加过冬季赛的角色保留了历史记录

3. 完成春季赛数据处理：
   - 重构update_nomination_stats.py，使用面向对象方式
   - 优化错误处理和日志输出
   - 添加类型提示和文档字符串
   - 完善数据验证和错误提示

4. 更新了以下文件：
   - data/characters/stats/ISML2024-characters.json
   - data/matches/character-matches.json
   - scripts/data_processing/update_characters_json.py
   - scripts/data_processing/update_character_matches.py
   - scripts/data_processing/add_nova_spring_to_excel.py
   - scripts/data_processing/update_nomination_stats.py

## 2025/1/31

### 角色对比功能优化

#### 问题描述
1. 票数差距显示错误：
   - 领先角色显示 `=0`
   - 落后角色显示错误的差距值
   - 箭头方向与实际情况不符

#### 原因分析
1. 判断条件逻辑错误：
   - `voteDiff > 0` 时判断为 `behind`
   - `voteDiff < 0` 时判断为 `leading`
   - 导致箭头和数值显示相反

#### 解决方案
1. 修正判断逻辑：
```javascript
<span class="vote-trend ${char.voteDiff > 0 ? 'leading' : 'behind'}">
    ${char.voteDiff === 0 ? 
        '=0' : 
        (char.voteDiff > 0 ? 
            `↑${char.voteDiff}` : 
            `↓${Math.abs(char.voteDiff)}`
        )
    }
</span>
```

2. 统一差距计算逻辑：
   - 领先方显示正值和上箭头
   - 落后方显示负值和下箭头
   - 票数相同时显示 `=0`

#### 效果验证
1. 惠惠（142票）vs 宫水三叶（68票）：
   - 惠惠显示：↑74（领先74票）
   - 宫水三叶显示：↓74（落后74票）
2. 得票率和排名差距也同样修正

#### 经验总结
1. 在处理对比数据时，要明确：
   - 正值表示领先
   - 负值表示落后
2. UI显示要与数据逻辑保持一致
3. 使用实际数据验证修改效果

- 完成基准对比功能
  - 基准角色显示得票数、得票率、排名
  - 对比角色显示与基准角色的差距
  - 自适应2列/3列布局
  - 优化搜索框交互体验

# 2025/2/1 更新

## 角色对比功能优化

### 基准对比改进
1. 修复了分隔线导致的卡片计数问题
2. 优化了对比结果的显示格式：
   - 箭头统一放在数值左侧
   - 相等时显示"=0"
   - 自动晋级角色不显示对比数据

### 拖拽功能完善
1. 只允许 character-card 进行拖拽
2. 拖拽后数据和显示正确同步
3. 保持了结果区域的展示顺序

### 代码优化
1. 修复了 reset 方法中的卡片计数问题
2. 统一使用 querySelectorAll('.character-card') 获取卡片
3. 避免分隔线影响卡片操作

### 其他改进
1. 完善了边界情况处理
2. 优化了代码结构和可维护性
3. 提升了用户交互体验

# 2025/2/1
- 重构配置管理
  - 将所有配置项移至 config.js 统一管理
  - 按功能模块分类配置（alert、comparison 等）
  - 优化配置结构，提高可维护性
- 优化提示框系统
  - 统一提示框显示时长配置
  - 根据提示类型设置不同时长
  - 短提示（1s）：操作反馈
  - 标准提示（2s）：错误警告
  - 长提示（3s）：复杂信息
- 代码优化
  - 移除重复配置
  - 统一配置路径
  - 提高代码可维护性

## 2025/2/2 代码结构说明

### 项目文件结构
- js/comparison/character-comparison.js: 主要业务逻辑
- js/common/config.js: 全局配置文件
- css/comparison/character-comparison.css: 样式文件
- pages/comparison/character-comparison.html: 对比页面
- data/config/events.json: 赛事配置数据

### 代码结构（4个类，35个函数）

### AlertBox 类
负责显示提示消息
- constructor(): 初始化提示框
- show(message, duration, type): 显示提示消息，支持不同类型和显示时长

### CharacterManager 类
负责管理角色数据和赛事数据
- constructor(): 初始化角色列表、选中角色和赛事数据
- findEventById(eventId): 根据ID查找赛事配置，遍历所有月份和赛事
- loadEvents(): 加载赛事配置文件，并生成赛事选择下拉菜单的选项
- getTotalVotes(eventId): 获取赛事总票数，用于计算得票率
- loadCharacters(eventId): 加载指定赛事的角色数据，包括名字、IP、票数等
- searchCharacters(keyword): 根据关键词搜索角色，支持名字、IP和CV搜索
- selectCharacter(cardId, character): 将角色添加到已选列表，与卡片ID关联
- getSelectedCharacters(): 获取所有已选角色的数组
- reset(): 清空所有已选角色
- getEventStats(eventId): 获取赛事的统计信息，包括总票数和有效票数

### ComparisonResultGenerator 类
负责生成对比结果
- generateBasicInfo(): 根据赛事阶段选择不同的对比逻辑
- generateNominationInfo(): 提名阶段的对比，包括票数差异和得票率
- generateBattleInfo(): 对战阶段的对比，显示胜负和票数差异
- generateFinalInfo(): 决赛阶段的对比，显示最终排名和得票
- generateOneToManyHTML(): 生成一对多对比的HTML，基准角色vs其他角色
- generateAvgCompareHTML(): 生成平均值对比的HTML，每个角色vs平均值

### UIManager 类
负责界面交互和事件处理
- constructor(characterManager): 初始化UI管理器，设置事件监听
- setupQuickCompareButtons(): 设置CV和IP快速对比按钮的功能
- setupEventListeners(): 设置所有事件监听，包括选择、搜索、拖拽等
- debounce(func, wait): 防抖函数，避免频繁触发搜索
- handleEventChange(eventId): 处理赛事切换，更新界面和数据
- resetExceptEvent(): 重置除赛事外的所有状态，包括卡片和结果
- handleSearch(input): 处理搜索输入，显示搜索结果列表
- selectCharacter(cardId, character): 选择角色，更新卡片显示
- addCharacter(): 添加新的角色卡片，设置事件监听
- deleteCharacter(cardElement): 删除角色卡片，同步更新数据
- handleFocus(input): 处理输入框聚焦，显示搜索结果
- handleKeydown(e): 处理键盘事件，支持上下键选择和回车确认
- updateDeleteButtons(): 更新删除按钮的显示状态
- updateQuickCompareButtons(): 更新快速对比按钮的可用状态
- setupDragAndDrop(): 设置卡片的拖拽功能，允许调整顺序
- calculateZIndex(index, compareType): 计算卡片的层级，保证正确显示
- compareCharacters(): 执行角色对比，生成并显示对比结果