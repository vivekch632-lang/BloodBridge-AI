import { supabase } from '../lib/supabaseClient';

/*
 * Convert a Supabase blood request row into the format
 * used by the React application.
 */
function mapRequest(row) {
  if (!row) return null;

  return {
    id: row.id,

    recipientId: row.recipient_id,

    patientName: row.patient_name || '',
    contactName: row.contact_name || '',

    bloodGroup: row.blood_group,

    unitsRequired: Number(row.units_required) || 0,

    status: row.status || 'Pending',

    hospitalName: row.hospital_name || '',
    hospital: row.hospital_name || '',
    hospitalAddress: row.hospital_address || '',

    city: row.city || '',

    /*
     * These are the real coordinates saved for the
     * emergency request.
     */
    latitude:
      row.latitude != null
        ? Number(row.latitude)
        : null,

    longitude:
      row.longitude != null
        ? Number(row.longitude)
        : null,

    urgency: row.urgency || 'normal',

    emergencyLevel:
      row.urgency || 'normal',

    requiredBy: row.required_by || null,

    /*
     * This was previously missing when creating the request.
     */
    requiredTime: row.required_time || '',

    contactPhone: row.contact_phone || '',

    notes: row.notes || '',

    createdAt: row.created_at,

    updatedAt: row.updated_at,

    /*
     * This will later be calculated from real matching data.
     */
    matchedDonorsCount: 0
  };
}


/*
 * Convert the UI emergency level into the values
 * stored in the Supabase blood_requests table.
 */
function mapEmergencyLevel(level) {
  switch (level) {
    case 'Critical':
      return 'critical';

    case 'Urgent':
      return 'urgent';

    case 'Standard':
      return 'standard';

    default:
      return 'normal';
  }
}


export const requestService = {

  /*
   * Get all emergency blood requests.
   */
  async getAll() {
    const { data, error } = await supabase
      .from('blood_requests')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    if (error) {
      console.error(
        'Error loading blood requests:',
        error
      );

      throw error;
    }

    return (data || []).map(mapRequest);
  },


  /*
   * Get one emergency request by its real Supabase ID.
   */
  async getById(id) {
    if (!id) {
      return null;
    }

    const { data, error } = await supabase
      .from('blood_requests')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error(
        'Error loading blood request:',
        error
      );

      throw error;
    }

    return mapRequest(data);
  },


  /*
   * Create a REAL emergency request in Supabase.
   */
  async create(formData) {
    const urgency = mapEmergencyLevel(
      formData.emergencyLevel
    );

    /*
     * Convert coordinates carefully.
     *
     * If the browser did not provide coordinates,
     * NULL is stored instead of inventing a location.
     */
    const latitude =
      formData.latitude != null &&
      Number.isFinite(Number(formData.latitude))
        ? Number(formData.latitude)
        : null;

    const longitude =
      formData.longitude != null &&
      Number.isFinite(Number(formData.longitude))
        ? Number(formData.longitude)
        : null;

    const requestRow = {

      patient_name:
        formData.patientName?.trim() || null,

      blood_group:
        formData.bloodGroup,

      units_required:
        Number(formData.unitsRequired),

      status:
        'Active',

      hospital_name:
        formData.hospital?.trim() || null,

      hospital_address:
        formData.hospitalAddress?.trim() || null,

      city:
        formData.city?.trim() || null,

      /*
       * REAL browser/device coordinates.
       */
      latitude,

      longitude,

      urgency,

      required_by:
        formData.requiredBy ?? null,

      /*
       * FIX:
       * Save the selected timeline.
       */
      required_time:
        formData.requiredTime || null,

      contact_name:
        formData.contactName?.trim() || null,

      contact_phone:
        formData.contactPhone?.trim() || null,

      notes:
        formData.notes?.trim() || null
    };


    console.log(
      'Creating emergency request:',
      requestRow
    );


    const { data, error } = await supabase
      .from('blood_requests')
      .insert(requestRow)
      .select()
      .single();


    if (error) {
      console.error(
        'Error creating blood request:',
        error
      );

      throw error;
    }


    console.log(
      'Emergency request created successfully:',
      data
    );


    return mapRequest(data);
  },


  /*
   * Update the status of an emergency request.
   *
   * Example:
   * Active -> Fulfilled
   * Active -> Cancelled
   */
  async updateStatus(id, status) {
    if (!id) {
      throw new Error(
        'A request ID is required.'
      );
    }

    const { data, error } = await supabase
      .from('blood_requests')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(
        'Error updating blood request:',
        error
      );

      throw error;
    }

    return mapRequest(data);
  },


  /*
   * Delete an emergency request.
   */
  async delete(id) {
    if (!id) {
      throw new Error(
        'A request ID is required.'
      );
    }

    const { error } = await supabase
      .from('blood_requests')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(
        'Error deleting blood request:',
        error
      );

      throw error;
    }

    return true;
  }
};