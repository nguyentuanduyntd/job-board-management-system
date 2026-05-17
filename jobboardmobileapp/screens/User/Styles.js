import { StyleSheet } from "react-native";

export default StyleSheet.create({
    // ─── Layout chung ────────────────────────────────────────────────────────
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
    },

    // ─── Header & Typography ─────────────────────────────────────────────────
    headerContainer: {
        alignItems: "center",
        paddingVertical: 30,
        backgroundColor: "#f8f9fa",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#3B5BDB",
        letterSpacing: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginTop: 15,
    },
    subTitle: {
        fontSize: 14,
        color: "#666",
        marginTop: 5,
    },

    // ─── Input & Form ────────────────────────────────────────────────────────
    input: {
        marginBottom: 15,
        backgroundColor: "#fff",
    },
    errorText: {
        color: "#fa5252",
        marginBottom: 10,
    },

    // ─── Buttons ─────────────────────────────────────────────────────────────
    submitBtn: {
        height: 50,
        justifyContent: "center",
        borderRadius: 8,
        backgroundColor: "#3B5BDB",
        marginTop: 10,
    },
    submitBtnText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    logoutBtn: {
        borderColor: "#fa5252",
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 10,
    },
    btnTextWhite: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
    googleBtn: {
        borderColor: "#3B5BDB",
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 8,
    },
    googleBtnContent: {
        height: 46,
    },

    // ─── Divider ─────────────────────────────────────────────────────────────
    dividerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 10,
        color: "#888",
        fontSize: 12,
    },

    // ─── Tags & Badges ────────────────────────────────────────────────────────
    tag: {
        marginTop: 10,
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: "#e7f5ff",
        borderRadius: 20,
    },
    tagText: {
        color: "#3B5BDB",
        fontSize: 12,
        fontWeight: "bold",
    },

    // ─── List & Spacing ───────────────────────────────────────────────────────
    infoSection: {
        paddingHorizontal: 10,
    },

    // ─── Footer & Links ───────────────────────────────────────────────────────
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 25,
    },
    link: {
        color: "#3B5BDB",
        fontWeight: "bold",
    },
    registerLink: {
        color: "#3B5BDB",
        fontWeight: "bold",
    },

    // ─── Register — chọn vai trò ──────────────────────────────────────────────
    roleLabel: {
        fontSize: 13,
        color: "#555",
        marginBottom: 6,
        marginTop: 4,
    },
    roleToggle: {
        marginBottom: 8,
    },
    roleActive: {
        borderColor: "#3B5BDB",
        borderWidth: 1.5,
        backgroundColor: "#EEF2FF",
    },
    roleInactive: {
        borderColor: "#ccc",
    },
    employerHint: {
        color: "#3B5BDB",
        marginBottom: 4,
    },
    avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#3B5BDB', borderRadius: 12,
    width: 24, height: 24, justifyContent: 'center', alignItems: 'center',
    },
    avatarEditText: {
        fontSize: 12,
    },
});