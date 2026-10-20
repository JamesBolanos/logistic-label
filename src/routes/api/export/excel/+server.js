import { error } from '@sveltejs/kit';
import * as XLSX from 'xlsx';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { labelSettings, logisticLabel, user } from '$lib/server/db/schema.js';
import { getOperationId, recordOperationalEvent } from '$lib/server/analytics/operationalEvents.js';

function formatDate(value) {
	if (!value) return '';
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (typeof value === 'string') {
		return value;
	}
	return '';
}

export async function GET({ locals, request }) {
	if (!locals.user?.id) {
		error(401, 'Authentication required');
	}

	if (!db) {
		error(503, 'Database is not configured');
	}

	const userId = locals.user.id;

	const [userRecord] = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt
		})
		.from(user)
		.where(eq(user.id, userId));

	const [settings] = await db
		.select()
		.from(labelSettings)
		.where(eq(labelSettings.userId, userId));

	const labels = await db
		.select()
		.from(logisticLabel)
		.where(eq(logisticLabel.userId, userId))
		.orderBy(logisticLabel.createdAt);

	const accountSettingsData = [
		{
			'User ID': userRecord?.id || userId,
			Name: userRecord?.name || '',
			Email: userRecord?.email || '',
			'Account Created At': formatDate(userRecord?.createdAt),
			'Account Updated At': formatDate(userRecord?.updatedAt),
			'Company Name': settings?.companyName || '',
			'GS1 Company Prefix': settings?.gs1CompanyPrefix || '',
			'Extension Digit': settings?.extensionDigit || '',
			'Next Serial Reference': settings?.nextSerialReference ?? '',
			'Print Bridge Host': settings?.printBridgeHost || '',
			'Print Bridge Port': settings?.printBridgePort ?? '',
			'Printer Hostname': settings?.printerHostname || '',
			'Printer Port': settings?.printerPort ?? '',
			'Printer DPI': settings?.printerDpi ?? '',
			'Settings Created At': formatDate(settings?.createdAt),
			'Settings Updated At': formatDate(settings?.updatedAt)
		}
	];

	const labelsData = labels.map((label) => ({
		'Label ID': label.id,
		'User ID': label.userId,
		'Label Type': label.labelType,
		'Template Version': label.templateVersion,
		'Print Layout': label.printLayout,
		GTIN: label.gtin || '',
		'Packaging Level': label.packagingLevel || '',
		'Lot Number': label.lotNumber || '',
		'Production Date': label.productionDate || '',
		'Date AI': label.dateAi || '',
		'Date Value': label.dateValue || '',
		Quantity: label.quantity ?? '',
		'Weight (lbs)': label.weightPounds ?? '',
		'Ship From': label.shipFrom || '',
		'Ship To': label.shipTo || '',
		'Purchase PO': label.purchaseOrder || '',
		Carrier: label.carrier || '',
		'Gross Weight': label.grossWeight ?? '',
		'Gross Weight Unit': label.grossWeightUnit || '',
		'Transport Count': label.transportCount ?? '',
		'Transport Count Type': label.transportCountType || '',
		SSCC: label.sscc,
		'Created At': formatDate(label.createdAt),
		Printed: label.printed ? 'Yes' : 'No',
		'Printed By': label.printedBy || '',
		'Printed At': formatDate(label.printedAt)
	}));

	const workbook = XLSX.utils.book_new();
	const accountSheet = XLSX.utils.json_to_sheet(accountSettingsData);
	const labelsSheet = XLSX.utils.json_to_sheet(labelsData);
	XLSX.utils.book_append_sheet(workbook, accountSheet, 'Account & Settings');
	XLSX.utils.book_append_sheet(workbook, labelsSheet, 'Labels');

	const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
	const dateStamp = new Date().toISOString().slice(0, 10);
	const filename = `logistic-label-data-${dateStamp}.xlsx`;

	await recordOperationalEvent({
		userId,
		eventName: 'data_export_succeeded',
		operationId: getOperationId(request),
		documentFormat: 'xlsx'
	});

	return new Response(buffer, {
		status: 200,
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'private, no-store'
		}
	});
}
