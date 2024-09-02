import { Button, Card, Col, Dropdown, MenuProps, message, Modal, Row, Space, Table, Tag } from 'antd';
import { GroupBridge, ProxyBridge, SyncBridge, TagBridge, WindowBridge } from '#preload';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState } from 'react';
import type { DB } from '../../../../shared/types/db';
import { MESSAGE_CONFIG, WINDOW_STATUS } from '/@/constants';
import { useNavigate } from 'react-router-dom';
import {
  CloseOutlined,
  // SendOutlined,
  ChromeOutlined,
  MoreOutlined,
  SearchOutlined,
  EditOutlined,
  GlobalOutlined,
  DeleteOutlined,
  SyncOutlined,
  UsergroupAddOutlined,
  // ExportOutlined,
  ExclamationCircleFilled,
} from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';

const Sync = () => {
  const OFFSET = 266;
  const [searchValue, setSearchValue] = useState(''); // Note: Set SOME_OFFSET based on your design
  const [tableScrollY, setTableScrollY] = useState(window.innerHeight - OFFSET); // Note: Set SOME_OFFSET based on your design
  const { t, i18n } = useTranslation();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<DB.Window>();
  const [windowData, setWindowData] = useState<DB.Window[]>([]);
  const [windowDataCopy, setWindowDataCopy] = useState<DB.Window[]>([]);
  const [groupOptions, setGroupOptions] = useState<DB.Group[]>([{ id: -1, name: 'All' }]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [tagMap, setTagMap] = useState(new Map<number, DB.Tag>());
  const [messageApi, contextHolder] = message.useMessage(MESSAGE_CONFIG);
  const [proxySettingVisible, setProxySettingVisible] = useState(false);
  const [proxies, setProxies] = useState<DB.Proxy[]>([]);
  const [selectedProxy, setSelectedProxy] = useState<number>();
  const navigate = useNavigate();

  const moreActionDropdownItems: MenuProps['items'] = [
    // {
    //   key: 'group',
    //   label: 'Switching Group',
    //   icon: <SendOutlined />,
    // },
    // {
    //   key: 'export',
    //   label: 'Export',
    //   icon: <ExportOutlined />,
    // },
    // {
    //   type: 'divider',
    // },
    {
      key: 'delete',
      danger: true,
      label: t('window_delete'),
      icon: <DeleteOutlined />,
    },
  ];
  const recorderDropdownItems: MenuProps['items'] = [
    {
      key: 'edit',
      label: t('window_edit'),
      icon: <EditOutlined />,
    },
    {
      key: 'proxy',
      label: t('window_proxy_setting'),
      icon: <GlobalOutlined />,
    },
    {
      key: 'set-cookie',
      label: t('window_set_cookie'),
      icon: <UsergroupAddOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      danger: true,
      label: t('window_delete'),
      icon: <DeleteOutlined />,
    },
  ];
  const columns: ColumnsType<DB.Window> = useMemo(() => {
    return [
      {
        title: 'ID',
        width: 60,
        dataIndex: 'id',
        key: 'id',
        fixed: 'left',
      },
      {
        title: t('window_column_profile_id'),
        width: 100,
        dataIndex: 'profile_id',
        key: 'profile_id',
        fixed: 'left',
      },
      {
        title: t('window_column_group'),
        width: 100,
        dataIndex: 'group_name',
        key: 'group_name',
        // fixed: 'left',
      },
      {
        title: t('window_column_name'),
        width: 100,
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: t('window_column_remark'),
        dataIndex: 'remark',
        key: 'remark',
        width: 150,
      },
      {
        title: t('window_column_tags'),
        dataIndex: 'tags',
        key: 'tags',
        width: 150,
        render: (_, recorder) => (
          <>
            {recorder.tags &&
              typeof recorder.tags === 'string' &&
              recorder.tags.split(',').map(tagId => {
                const tag = tagMap.get(Number(tagId));
                return (
                  <Tag
                    key={tagId}
                    color={tag?.color}
                  >
                    {tag?.name}
                  </Tag>
                );
              })}
          </>
        ),
      },
      {
        title: t('window_column_proxy'),
        dataIndex: 'proxy',
        key: 'proxy',
        width: 350,
      },
      {
        title: t('window_column_last_open'),
        dataIndex: 'opened_at',
        key: 'opened_at',
        width: 150,
        render: value => {
          if (!value) return '';
          const utcDate = new Date(value + 'Z');

          const localDateStr = utcDate.toLocaleString();
          return localDateStr;
        },
      },
      {
        title: t('window_column_created_at'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 150,
        render: value => {
          const utcDate = new Date(value + 'Z');

          const localDateStr = utcDate.toLocaleString();
          return localDateStr;
        },
      },
    ];
  }, [tagMap, i18n.language]);
  const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
    setSelectedRowKeys(newSelectedRowKeys as number[]);
  };
  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };
  const fetchOpenedWindows = async () => {
    const windows = await WindowBridge.getOpenedWindows();
    console.log(windows);
  };

  useEffect(() => {
    fetchOpenedWindows();
  }, []);

  const handleTileWindows = () => {
    SyncBridge.tileWindows();
  };


  const fetchWindowData = async () => {
    setLoading(true);
    const data = await WindowBridge?.getAll();
    setWindowData(data);
    setWindowDataCopy(data);
    setLoading(false);
    setSelectedRowKeys([]);
    setSelectedRow(undefined);
  };
  const fetchTagData = async () => {
    const data = await TagBridge?.getAll();
    const newTagMap = new Map<number, DB.Tag>();
    data?.forEach((tag: DB.Tag) => {
      newTagMap.set(tag.id!, tag);
    });
    setTagMap(newTagMap);
  };

  const fetchGroupData = async () => {
    const data = await GroupBridge?.getAll();
    data.splice(0, 0, { id: -1, name: 'All' });
    setGroupOptions(data);
  };

  const fetchProxies = async () => {
    const proxies = await ProxyBridge?.getAll();
    setProxies(
      proxies.map((proxy: DB.Proxy) => {
        return {
          host: proxy.proxy?.split(':')[0] ?? proxy.id,
          ...proxy,
        };
      }),
    );
  };
  useEffect(() => {
    fetchTagData();
    fetchProxies();
    fetchGroupData();
    fetchWindowData();
  }, []);
  // type FieldType = SettingOptions;

  const handleGroupControl = () => {
    // 如果选中了多个窗口 则将选中的窗口进行群控 否则不进行群控 并且设置主控窗口为当前选中的窗口
    const masterProcessId = selectedRowKeys[0];
    const slaveProcessIds = selectedRowKeys.slice(1);
    SyncBridge.startGroupControl(masterProcessId, slaveProcessIds);
  };

  const [groupControlVisible, setGroupControlVisible] = useState(false);

  return (
    <>
      <Card
        className="content-card p-6"
        bordered={false}
      >
        <Row>
          <Col span={24}>
            <Space>
              <Button
                type="primary"
                onClick={handleTileWindows}
              >
                {t('tile_windows')}
              </Button>
              {/* 点击群控 弹出一个窗口 用户可以选择当前选中的窗口进行群控 并且指定一个主控窗口 */}
              <Modal
                title="群控"
                open={groupControlVisible}
                onOk={handleGroupControl}
                onCancel={() => setGroupControlVisible(false)}
              >
                <Table
                  columns={columns.slice(0, 4)}
                  rowKey={'id'}
                  dataSource={windowData}
                  pagination={false}
                />
              </Modal>
              <Button
                type="primary"
                onClick={() => setGroupControlVisible(true)}
              >
                群控
              </Button>
            </Space>
            <Table
              className="content-table"
              columns={columns}
              rowKey={'id'}
              loading={loading}
              rowSelection={rowSelection}
              dataSource={windowData}
              scroll={{ x: 1500, y: tableScrollY }}
              pagination={{ rootClassName: 'pagination-wrapper' }}
            />
          </Col>
          <Col span={7}></Col>
        </Row>
      </Card>
    </>
  );
};
export default Sync;
