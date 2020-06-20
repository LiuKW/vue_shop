<template>
  <div>
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>商品分类</el-breadcrumb-item>
      <el-breadcrumb-item>商品分类</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图区域 -->
    <el-card>
      <el-row>
        <el-col>
          <el-button type="primary" @click="showAddCateDialog">添加分类</el-button>
        </el-col>
      </el-row>
      <!-- 表格 -->
      <tree-table
        class="treeTable"
        :data="cateList"
        :columns="columns"
        :selection-type="false"
        :expand-type="false"
        show-index
        index-text="#"
        border
      >
        <!-- 是否有效 -->
        <template slot="isok" slot-scope="scope">
          <i
            class="el-icon-success"
            v-if="scope.row.cat_deleted == false"
            style="color: lightgreen;"
          ></i>
          <i class="el-icon-error" style="color: red;" v-else></i>
        </template>
        <!-- 排序模板 -->
        <template slot="order" slot-scope="scope">
          <el-tag size="mini" v-if="scope.row.cat_level == 0">一级</el-tag>
          <el-tag type="success" size="mini" v-else-if="scope.row.cat_level == 1">二级</el-tag>
          <el-tag type="warning" size="mini" v-else>三级</el-tag>
        </template>
        <template slot="opt" slot-scope="scope">
          <el-button type="primary" icon="el-icon-edit" size="mini">编辑</el-button>
          <el-button type="danger" icon="el-icon-delete" size="mini">删除</el-button>
        </template>
      </tree-table>
      <!-- 分页 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="queryInfo.pagenum"
        :page-sizes="[1, 2, 5, 10]"
        :page-size="queryInfo.pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      ></el-pagination>
    </el-card>

    <!-- 添加分类对话框 -->
    <el-dialog title="添加分类" :visible.sync="addCateDialogVisible" width="50%" 
        @close="addCateDialogClosed">
      <!-- 添加分类表单 -->
      <el-form
        :model="addCateForm"
        :rules="addCateFormRules"
        ref="addCateFormRef"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="cat_name">
          <el-input v-model="addCateForm.cat_name"></el-input>
        </el-form-item>
        <el-form-item label="父级分类">
          <!-- options指定数据源 -->
          <!-- props用来指定配置对象 -->
          <!-- v-model绑定的必须是数组 -->
          <el-cascader
            v-model="selectedKeys"
            :options="parentCateList"
            :props="cascaderProps"
            @change="parentCateChanged"
            clearable
          ></el-cascader>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addCateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addCate">确 定</el-button>
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
      // 查询条件
      // 查询条件
      queryInfo: {
        type: 3,
        pagenum: 1,
        pagesize: 5
      },
      // 商品分类的数据列表，默认为空
      cateList: [],
      // 总数据条数
      total: 0,
      // 为table指定列的定义
      columns: [
        {
          label: "分类名称",
          prop: "cat_name"
        },
        {
          label: "是否有效",
          // 将当前列定义为模板列
          type: "template",
          // 表示当前列使用的模板名称
          template: "isok"
        },
        {
          label: "排序",
          type: "template",
          template: "order"
        },
        {
          label: "操作",
          type: "template",
          template: "opt"
        }
      ],
      // 添加对话框显示标志
      addCateDialogVisible: false,
      // 添加分类分类对话框表单对象
      addCateForm: {
        // 分类名称
        cat_name: "",
        // 父级分类id
        cat_pid: 0,
        // 分类的等级，默认要添加的是一级分类
        cat_level: 0
      },
      // 添加分类分类对话框表单对象校验规则
      addCateFormRules: {
        cat_name: [
          { required: true, message: "请填写分类名称", trigger: "blur" }
        ]
      },
      // 父级分类列表
      parentCateList: [],
      // 指定级联选择器的配置对象
      cascaderProps: {
        expandTrigger: "hover",
        value: "cat_id",
        label: "cat_name",
        children: "children",
        checkStrictly: true
      },
      // 选中的父级分类的Id数组
      selectedKeys: []
    };
  },

  methods: {
    // 获取商品分类数据
    async getCateList() {
      const { data: res } = await this.$http.get("categories", {
        params: this.queryInfo
      });

      if (res.meta.status !== 200) {
        return this.$message.error("获取商品分类失败！");
      }

      // 把数据列表，赋值给 catelist
      this.cateList = res.data.result;
      // 为总数据条数赋值
      this.total = res.data.total;
    },

    // 监听页面条数变化
    handleSizeChange(newSize) {
      this.queryInfo.pagesize = newSize;
      this.getCateList();
    },

    // 监听页面页码变化
    handleCurrentChange(newPage) {
      this.queryInfo.pagenum = newPage;
      this.getCateList();
    },

    //点击按钮，展示添加分类的对话框
    showAddCateDialog() {
      // 先获取父级分类的列表，再展示对话框
      this.getParentCateList();
      this.addCateDialogVisible = true;
    },

    // 获取父级分类列表
    async getParentCateList() {
      const { data: res } = await this.$http.get("categories", {
        params: { type: 2 }
      });
      if (res.meta.status !== 200)
        return this.$message.error("获取父级分类数据失败!");
      this.parentCateList = res.data;
      console.log(this.parentCateList);
    },
    // 选择项发生变化触发这个函数
    parentCateChanged() {
      // 发生变化变化变化的值立即同步到v-model绑定的数组中
      // 因为只要点击了级联选择器，就会向v-model中加入数据
      // 选中的父级id永远是selectKeys中最后一项元素
      if (this.selectedKeys.length > 0) {
        this.addCateForm.cat_pid = this.selectedKeys[this.selectedKeys.length - 1];
        this.addCateForm.cat_level = this.selectedKeys.length;
        return;
      }
      else{
        this.addCateForm.cat_pid = 0
        this.addCateForm.cat_level = 0
      }
    },
    // 添加分类点击确定
    addCate() {
      // console.log(this.addCateForm);
      this.$refs.addCateFormRef.validate(async valid => {
        if(!valid) return;
        const { data:res } = await this.$http.post("categories", this.addCateForm);
        if(res.meta.status != 201)
          return this.$message.error('添加分类失败')
        this.$message.success('添加分类成功') 
        this.getCateList();
        this.addCateDialogVisible = false;
      })
    },
    // 添加分类对话框关闭，重置表单
    addCateDialogClosed() {
      this.$refs.addCateFormRef.resetFields();
      // 同时清空级联选择框，和父级id，level
      this.selectedKeys = []
      this.addCateForm.cat_level = 0
      this.addCateForm.cat_pid = 0
    }
  }
};
</script>

<style lang="less" scoped>
.treeTable {
  margin-top: 15px;
}

.el-cascader {
  width: 100%;
}
</style>