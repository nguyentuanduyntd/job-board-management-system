import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../configs/Apis';

const usePagination = (endpoint, pageSize = 10, extraParams = '') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [count, setCount] = useState(0);

    const load = useCallback(async (pageNumber = 1, isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const url = `${endpoint}?page=${pageNumber}&page_size=${pageSize}${extraParams}`;
            const res = await authApi(token).get(url);
 
            if (res.data.results !== undefined) {
                setData(res.data.results);
                setCount(res.data.count || 0);
                setTotalPages(Math.ceil((res.data.count || 0) / pageSize));
            } else {
                setData(res.data);
                setTotalPages(1);
            }
            setPage(pageNumber);
        } catch (ex) {
            console.error('Pagination load error:', ex.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [endpoint, pageSize, extraParams]);
 
    const refresh = () => load(1, true);
    const goTo    = (p) => load(p);
 
    return { data, setData, loading, refreshing, page, totalPages, count, load, refresh, goTo };
};
export default usePagination;