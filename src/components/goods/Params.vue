<template>
  <div>
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>商品管理</el-breadcrumb-item>
      <el-breadcrumb-item>参数列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图区域 -->
    <el-card>
      <el-alert show-icon title="注意：只允许为第三级分类设置相关参数！" type="warning" :closable="false"></el-alert>

      <!-- 选择商品分类区域 -->
      <el-row class="cat_opt">
        <el-col>
          <span>选择商品分类：</span>
          <!-- 商品分类级联选择框 -->
          <el-cascader
            v-model="selectedCateKeys"
            :options="cateList"
            :props="cateProps"
            @change="handleChange"
          ></el-cascader>
        </el-col>
      </el-row>

      <!-- 页签区域 -->
      <el-tabs v-model="activeName" @tab-click="handleTabClick">
        <!-- 添加动态参数的面板 -->
        <el-tab-pane label="动态参数" name="many">
          <el-button
            type="primary"
            size="mini"
            :disabled="isBtnDisabled"
            @click="addDialogVisible=true"
          >添加参数</el-button>
          <!-- 动态参数表格 -->
          <el-table :data="manyTableData" border stripe>
            <!-- 展开行 -->
            <el-table-column type="expand">
              <template slot-scope="scope">
                <el-tag v-for="(item, i) in scope.row.attr_vals" :key="i" closable>{{item}}</el-tag>
                <el-input
                  class="input-new-tag"
                  v-if="scope.row.inputVisible"
                  v-model="scope.row.inputValue"
                  ref="saveTagInput"
                  size="small"
                  @keyup.enter.native="handleInputConfirm(scope.row)"
                  @blur="handleInputConfirm(scope.row)"
                ></el-input>
                <el-button v-else class="button-new-tag" size="small" @click="showInput(scope.row)">+ New Tag</el-button>
              </template>
            </el-table-column>
            <el-table-column type="index"></el-table-column>
            <el-table-column label="参数名称" prop="attr_name"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <div>
                  <el-button
                    type="primary"
                    icon="el-icon-edit"
                    size="mini"
                    @click="showEditDialog(scope.row.attr_id)"
                  >修改</el-button>
                  <el-button type="danger" icon="el-icon-delete" size="mini">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <!-- 添加静态属性的面板 -->
        <el-tab-pane label="静态属性" name="only">
          <el-button
            type="primary"
            size="mini"
            :disabled="isBtnDisabled"
            @click="addDialogVisible=true"
          >添加属性</el-button>
          <!-- 静态属性表格 -->
          <el-table :data="onlyTableData" border stripe>
            <!-- 展开行 -->
            <el-table-column type="expand"></el-table-column>
            <el-table-column type="index"></el-table-column>
            <el-table-column label="属性名称" prop="attr_name"></el-table-column>
            <el-table-column label="操作">
              <template slot-scope="scope">
                <div>
                  <el-button
                    type="primary"
                    icon="el-icon-edit"
                    size="mini"
                    @click="showEditDialog"
                  >修改</el-button>
                  <el-button type="danger" icon="el-icon-delete" size="mini">删除</el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 添加参数对话框 -->
    <el-dialog
      :title="'添加' + titleText"
      :visible.sync="addDialogVisible"
      width="50%"
      @close="addDialogClosed"
    >
      <el-form :model="addForm" :rules="addFormRules" ref="addFormRef" label-width="100px">
        <el-form-item :label="titleText" prop="attr_name">
          <el-input v-model="addForm.attr_name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addParams">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改参数对话框 -->
    <el-dialog
      :title="'修改' + titleText"
      :visible.sync="editDialogVisible"
      width="50%"
      @close="editDialogClosed"
    >
      <el-form :model="editForm" :rules="editFormRules" ref="editFormRef" label-width="100px">
        <el-form-item :label="titleText" prop="attr_name">
          <el-input v-model="editForm.attr_name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="editParams">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  created() {
    this.getCateList();
  },
  data() {
    return {
      cateList: [],
      // 级联选择框配置对象
      cateProps: {
        expandTrigger: "hover",
        value: "cat_id",
        label: "cat_name",
        children: "children"
      },
      // 级联选择框双向绑定的数组
      selectedCateKeys: [],
      // 被激活的页签名称
      activeName: "many",
      manyTableData: [],
      onlyTableData: [],
      addDialogVisible: false, // 添加参数对话框显示标志
      addForm: {
        attr_name: ""
      },
      addFormRules: {
        attr_name: [
          { required: true, message: "请输入参数名称", trigger: "blur" }
        ]
      },
      editDialogVisible: false, // 修改对话框显示标志
      editForm: [],
      editFormRules: {
        attr_name: [
          { required: true, message: "请输入参数名称", trigger: "blur" }
        ]
      }
    };
  },
  methods: {
    // 获取所有的商品分类列表
    async getCateList() {
      const { data: res } = await this.$http.get("categories");
      if (res.meta.status !== 200)
        return this.$message.error("获取商品分类列表失败");
      this.cateList = res.data;
    },

    //级联选择框选择事件
    handleChange() {
      this.getParamsData();
    },

    // tab页签点击事件处理函数
    handleTabClick() {
      this.getParamsData();
    },

    // 获取参数的列表数据
    async getParamsData() {
      // 证明选中的不是三级分类
      if (this.selectedCateKeys.length !== 3) {
        this.selectedCateKeys = [];
        this.manyTableData = [];
        this.onlyTableData = [];
        return;
      }

      // 证明选中的是三级分类
      console.log(this.selectedCateKeys);
      // 根据所选分类的Id，和当前所处的面板，获取对应的参数
      const { data: res } = await this.$http.get(
        `categories/${this.cateId}/attributes`,
        {
          params: { sel: this.activeName }
        }
      );

      res.data.forEach(item => {
        //先判断数组是否为空
        item.attr_vals = item.attr_vals ? item.attr_vals.split(" ") : [];
        // 给数组的每个元素添加展示标志
        item.inputVisible = false,
        // 给数组的每个元素添加修改绑定值
        item.inputValue = ''
      });
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg);
      if (this.activeName === "many") this.manyTableData = res.data;
      else this.onlyTableData = res.data;
    },
    // 添加参数对话框关闭事件
    addDialogClosed() {
      this.$refs.addFormRef.resetFields();
    },
    // 添加参数对话框点击确定按钮
    addParams() {
      this.$refs.addFormRef.validate(async valid => {
        if (!valid) return;
        const { data: res } = await this.$http.post(
          `categories/${this.cateId}/attributes`,
          {
            attr_name: this.addForm.attr_name,
            attr_sel: this.activeName
          }
        );
        if (res.meta.status !== 201) return this.$message.error(res.meta.msg);
        this.$message.success("添加参数成功");
        this.addDialogVisible = false;
        this.getParamsData();
      });
    },
    // 点击按钮展示修改对话框
    async showEditDialog(attr_id) {
      const { data: res } = await this.$http.get(
        `categories/${this.cateId}/attributes/${attr_id}`,
        {
          params: { attr_sel: this.activeName }
        }
      );
      if (res.meta.status !== 200) return this.$message.error(res.meta.msg);
      this.editForm = res.data;
      this.editDialogVisible = !this.editDialogVisible;
    },
    // 修改对话框关闭事件
    editDialogClosed() {
      this.$refs.editFormRef.resetFields();
    },
    // 修改对话框点击确定
    editParams() {},
    
    // 文本框失去焦点或按下enter键
    handleInputConfirm(row) {
        // 去空格
        if(row.inputValue.trim().length === 0)
            row.inputValue = ''
        row.inputVisible = false
    },

    //
    showInput(row) {
        row.inputVisible = true;
        // 让文本框自动获得焦点，
        // $nextTick的作用就是当页面上元素被重新渲染之后才会指定回调函数中的代码
        this.$nextTick(_ => {
          this.$refs.saveTagInput.$refs.input.focus();
        });
    }
  },
  computed: {
    // 判断按钮是否应该被禁用
    isBtnDisabled() {
      if (this.selectedCateKeys.length != 3) return true;
      return false;
    },

    // 当前选中的三级分类的id
    cateId() {
      if (this.selectedCateKeys.length === 3) {
        return this.selectedCateKeys[2];
      }
      return null;
    },

    // 动态计算标题
    titleText() {
      if (this.activeName == "many") return "动态参数";
      return "静态属性";
    }
  }
};
</script>

<style lang="less" scoped>
.cat_opt {
  margin: 15px 0;
}

.el-tag {
  margin: 10px;
}

.input-new-tag{
    width: 150px;
}
</style>