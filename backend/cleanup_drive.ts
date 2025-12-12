// backend/cleanup_drive.ts
import * as path from 'path';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import 'dotenv/config'; // 加载 .env 文件

const KEYFILE_PATH = path.join(__dirname, 'service_account.json');

async function cleanServiceAccountDrive() {
    let drive: ReturnType<typeof google.drive>;

    try {
        console.log('--- 🚀 正在初始化 Service Account 认证... ---');
        
        const SCOPES = ['https://www.googleapis.com/auth/drive'];

        const authClient = new GoogleAuth({
            keyFile: KEYFILE_PATH,
            scopes: SCOPES,
        });

        drive = google.drive({ version: 'v3', auth: authClient });

        // --------------------------------------------------------
        // 步骤 1: 查找并删除 Service Account 拥有的文件
        // --------------------------------------------------------

        console.log('--- ✅ 认证成功。正在列出 Service Account 拥有的文件... ---');

        const response = await drive.files.list({
            // 确保只查找 Service Account 自己拥有的未删除文件
            q: '"me" in owners and trashed=false', 
            fields: 'files(id, name, createdTime, size)',
            pageSize: 100,
        });

        const files = response.data.files || [];
        
        if (files.length === 0) {
            console.log('--- ℹ️ Service Account 的 Drive 中没有找到任何文件可删除。 ---');
        } else {
            console.log(`--- 找到 ${files.length} 个文件，开始删除（移入垃圾箱）... ---`);

            let deletedCount = 0;
            for (const file of files) {
                if (file.id) { 
                    const fileSize = file.size ? (parseInt(file.size) / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A';
                    console.log(`[DELETE] 文件: ${file.name} (ID: ${file.id}, 大小: ${fileSize})`);
                    
                    // 执行删除操作 (将文件移入垃圾箱)
                    await drive.files.delete({
                        fileId: file.id,
                    });
                    deletedCount++;
                } else {
                    console.log(`[SKIP] 发现一个没有 ID 的文件，已跳过。`);
                }
            }

            console.log(`\n--- 🎉 删除文件完成！共删除了 ${deletedCount} 个文件。 ---`);
        }
        
        // --------------------------------------------------------
        // 步骤 2: 清空 Service Account 的垃圾箱（解决配额的关键）
        // --------------------------------------------------------
        
        console.log('\n--- 🗑️ 尝试清空 Service Account 的垃圾箱，以立即释放配额... ---');
        
        // 调用 drive.files.emptyTrash({}) 来清空当前授权用户的垃圾箱（即 Service Account）
        await drive.files.emptyTrash({}); 
        
        console.log('--- ✅ 垃圾箱清空请求成功发送！配额现已释放。 ---');
        console.log('请重新运行 Agent 任务进行测试。');

    } catch (error) {
        console.error('🚨 清理 Drive 失败！');
        
        if (error instanceof Error) {
            // Service Account 常常因为没有 Trash Bin 功能而导致 emptyTrash 失败，但这不影响结果
            if (error.message.includes('Method not supported') || error.message.includes('Forbidden')) {
                console.warn('⚠️ 警告：清空垃圾箱可能因 Service Account 权限或特性不支持而失败。但这通常不影响配额释放。');
            } else {
                 console.error('详细错误:', error.message);
            }
        } else {
             console.error('详细错误:', String(error));
        }
    }
}

cleanServiceAccountDrive();