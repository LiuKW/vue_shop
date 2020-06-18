<template>
  <div>
    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 卡片视图 -->
    <el-card>
      <!-- 添加角色按钮区域 -->
      <el-row>
        <el-col>
          <el-button type="primary">添加角色</el-button>
        </el-col>
      </el-row>

      <!-- 角色列表区域 -->
      <el-table :data="roleList" border stripe>
        <!-- 展开列，渲染角色下的所有权限 -->
        <el-table-column type="expand">
          <template slot-scope="scope">
            <!-- i1是循环的索引 -->
            <el-row
              :class="['bdbottom', i1 === 0 ? 'bdtop' : '', 'vcenter']"
              v-for="(item1, i1) in scope.row.children"
              :key="item1.id"
            >
              <!-- 一级权限 -->
              <el-col :span="5">
                <el-tag closable @close="removeRightById(scope.row, item1.id)">{{item1.authName}}</el-tag>
                <!-- 小箭头 -->
                <i class="el-icon-caret-right"></i>
              </el-col>
              <!-- 二级权限和三级权限 -->
              <el-col :span="19">
                <!-- 渲染二级权限 -->
                <el-row
                  :class="[i2 === 0 ? '' : 'bdtop', 'vcenter']"
                  v-for="(item2, i2) in item1.children"
                  :key="item2.id"
                >
                  <el-col :span="6">
                    <el-tag
                      type="success"
                      closable
                      @close="removeRightById(scope.row, item2.id)"
                    >{{item2.authName}}</el-tag>
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <el-col :span="18">
                    <el-tag
                      type="warning"
                      v-for="(item3) in item2.children"
                      :key="item3.id"
                      closable
                      @close="removeRightById(scope.row, item3.id)"
                    >{{item3.authName}}</el-tag>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <el-table-column type="index"></el-table-column>
        <el-table-column label="角色名称" prop="roleName"></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
        <el-table-column label="操作" width="300px">
          <template slot-scope="scope">
            <el-button size="mini" type="primary" icon="el-icon-edit">编辑</el-button>
            <el-button size="mini" type="danger" icon="el-icon-delete">删除</el-button>
            <el-button
              size="mini"
              type="warning"
              icon="el-icon-setting"
              @click="showSetRightDialog(scope.row)"
            >分配权限</el-button>
          </template>
        </el-table-column>
        <el-table-column label="角色名称" prop="roleName"></el-table-column>
      </el-table>
    </el-card>

    <!-- 分配权限对话框 -->
    <el-dialog title="分配权限" :visible.sync="setRightDialogVisible" width="50%" @close="setRightDialogClosed">
      <!-- 将权限列表渲染成树形结构 -->
      <el-tree
        show-checkbox
        :data="rightList"
        :props="treeProps"
        node-key="id"
        :default-checked-keys="defKeys"
        ref="treeRef"
        default-expand-all
      ></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="setRightDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="allotRights">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  created() {
    this.getRolesList();
  },

  data() {
    return {
      // 所有角色的列表数据
      roleList: [],
      // 分配权限对话框控制
      setRightDialogVisible: false,
      // 所有权限数据
      rightList: [],
      // 树形控件的属性绑定对象，控制树长成什么样子
      treeProps: {
        label: "authName", // 看到的哪个属性对应的值
        children: "children" // 父子属性通过哪个属性嵌套
      },
      
      defKeys: [],  // 默认选中的节点id值数组，把三级权限添加到数组中，就能显示当前角色拥有的权限

      roleId: '', //临时保存当前即将分配权限的角色id
    };
  },

  methods: {
    // 获取所有角色的列表
    async getRolesList() {
      const { data: res } = await this.$http.get("roles");
      if (res.meta.status !== 200)
        return this.$message.error("获取角色列表失败");
      this.roleList = res.data;
    },

    // 根据id删除对应的权限
    async removeRightById(role, rightId) {
      // 弹框提示用户是否要删除权限
      const confirmResult = await this.$confirm(
        "此操作将永久删除该权限, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      ).catch(error => error);
      if (confirmResult !== "confirm") {
        return this.$message.info("取消了删除");
      }

      const { data: res } = await this.$http.delete(
        `roles/${role.id}/rights/${rightId}`
      );
      if (res.meta.status !== 200) return this.$message.error("删除权限失败");

      // 为了防止整个页面重新渲染，为局部赋值，前提是接口必须返回对应局部的数据
      role.children = res.data;
    },

    // 展示分配权限的对话框
    async showSetRightDialog(role) {
        this.roleId = role.id
      // this.setRightDialogVisible = !this.setRightDialogVisible;
      // 获取所有权限数据
      const { data: res } = await this.$http.get("rights/tree");
      if (res.meta.status !== 200)
        return this.$message.error("获取权限数据失败");

      this.rightList = res.data;
      // 递归获取三级节点的Id
      this.getLeafKeys(role, this.defKeys);

      this.setRightDialogVisible = true;
    },

    // 通过递归，获取角色下所有三级权限的id，并保存到defKeys数组中
    getLeafKeys(node, arr) {
      // 如果不包含children属性，则是三级节点
      if (!node.children) return arr.push(node.id);

      node.children.forEach(item => this.getLeafKeys(item, arr));
    },

    // 分配权限对话框关闭，清空数组
    setRightDialogClosed() {
        this.defKeys = [];
    },
     
    // 为角色分配权限
    async allotRights() {
        // 处理请求参数
        const keys = [
            // 展开运算符
            ...this.$refs.treeRef.getCheckedKeys(),
            ...this.$refs.treeRef.getHalfCheckedKeys()
        ]
        const idStr = keys.join(',');
        const { data: res } = await this.$http.post(`roles/${this.roleId}/rights`, { rids:idStr })
        if(res.meta.status !== 200)
            return this.$message.error("分配权限失败");
        this.$message.success("分配权限成功");
        this.getRolesList();
        this.setRightDialogVisible = false;
    }
  }
};
</script>

<style lang="less" scoped>
.el-tag {
  margin: 7px;
}

.bdtop {
  border-top: 1px solid #eee;
}

.bdbottom {
  border-top: 1px solid #eee;
}

.vcenter {
  display: flex;
  align-items: center;
}
</style>